const Booking = require('../models/Booking');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const CreditTransaction = require('../models/CreditTransaction');
const Notification = require('../models/Notification');
const CreditService = require('../services/creditService');
const VideoSessionService = require('../services/videoSessionService');
const { createError } = require('../utils/error');
const { sendEmail, templates } = require('../utils/sendEmail');
const logger = require('../utils/logger');

/**
 * Create a new booking
 * @route POST /api/v1/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    const menteeId = req.user.id;
    const { mentorId, scheduledAt, durationMinutes, notes } = req.body;

    // Check if mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      throw createError(404, 'Mentor not found');
    }

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile || !mentorProfile.isAvailable) {
      throw createError(400, 'Mentor is not available for bookings');
    }

    // Check mentor's availability for the requested time
    const bookingDate = new Date(scheduledAt);
    const day = bookingDate.toLocaleLowerCase('en-US', { weekday: 'long' });
    const time = bookingDate.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const isAvailable = await mentorProfile.isSlotAvailable(day, time, 
      new Date(bookingDate.getTime() + durationMinutes * 60000).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    if (!isAvailable) {
      throw createError(400, 'Selected time slot is not available');
    }

    // Check for scheduling conflicts
    const hasConflict = await Booking.hasConflict(mentorId, scheduledAt, durationMinutes);
    if (hasConflict) {
      throw createError(400, 'Time slot already booked');
    }

    // Calculate credits required
    const creditsRequired = Math.ceil(durationMinutes / 30); // 1 credit per 30 minutes
    
    // Check mentee's credits
    const mentee = await User.findById(menteeId);
    if (mentee.credits < creditsRequired) {
      throw createError(400, 'Insufficient credits');
    }

    // Create booking
    const booking = await Booking.create({
      mentorId,
      menteeId,
      scheduledAt,
      durationMinutes,
      notes,
      creditsSpent: creditsRequired
    });

    // Create notification for mentor
    await Notification.create({
      userId: mentorId,
      type: 'booking_request',
      title: 'New Booking Request',
      body: `${mentee.name} has requested a ${durationMinutes}-minute session`,
      data: {
        bookingId: booking._id,
        menteeId: menteeId
      }
    });

    // Send email to mentor
    await sendEmail(
      mentor.email,
      'New Booking Request',
      `You have a new booking request from ${mentee.name} for ${durationMinutes} minutes on ${new Date(scheduledAt).toLocaleString()}`
    );

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm a booking
 * @route PUT /api/v1/bookings/:id/confirm
 */
const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentorId = req.user.id;
    const { meetingLink } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw createError(404, 'Booking not found');
    }

    if (booking.mentorId.toString() !== mentorId) {
      throw createError(403, 'Not authorized to confirm this booking');
    }

    if (booking.status !== 'pending') {
      throw createError(400, `Booking cannot be confirmed (current status: ${booking.status})`);
    }

    // Update booking status
    booking.status = 'confirmed';
    
    // Create a meeting room using VideoSessionService
    const channelName = `session_${booking._id}`;
    booking.session = {
      channelName,
      createdAt: new Date()
    };
    
    // Keep the external meeting link if provided
    if (meetingLink) {
      booking.meetingLink = meetingLink;
    }
    
    await booking.save();

    // Deduct credits from mentee using CreditService
    await CreditService.useCreditsForBooking({
      userId: booking.menteeId,
      bookingId: booking._id,
      mentorId: booking.mentorId,
      creditsRequired: booking.creditsSpent
    });

    // Create notifications
    const mentee = await User.findById(booking.menteeId);
    await Notification.create({
      userId: booking.menteeId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      body: `Your session has been confirmed by the mentor`,
      data: {
        bookingId: booking._id,
        meetingLink
      }
    });

    // Send confirmation email to mentee
    const mentor = await User.findById(mentorId);
    await sendEmail(
      mentee.email,
      ...Object.values(templates.bookingConfirmation(booking, mentor, mentee))
    );

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * @route PUT /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw createError(404, 'Booking not found');
    }

    // Check authorization
    if (booking.mentorId.toString() !== userId && 
        booking.menteeId.toString() !== userId) {
      throw createError(403, 'Not authorized to cancel this booking');
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw createError(400, `Booking cannot be cancelled (current status: ${booking.status})`);
    }

    // Check cancellation timeframe (24 hours before for confirmed bookings)
    if (booking.status === 'confirmed') {
      const now = new Date();
      const sessionTime = new Date(booking.scheduledAt);
      const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60);

      if (hoursUntilSession < 24) {
        throw createError(400, 'Bookings can only be cancelled at least 24 hours before the session');
      }
    }

    // Update booking status
    await booking.cancel(userId, reason);

    // Refund credits if the booking was confirmed using CreditService
    if (booking.status === 'confirmed') {
      await CreditService.refundCredits({
        userId: booking.menteeId,
        bookingId: booking._id,
        amount: booking.creditsSpent,
        reason: reason || 'Booking cancelled'
      });
    }

    // Create notifications
    const cancelledBy = await User.findById(userId);
    const notifyUserId = userId === booking.mentorId.toString() 
      ? booking.menteeId 
      : booking.mentorId;

    await Notification.create({
      userId: notifyUserId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      body: `Booking was cancelled by ${cancelledBy.name}. Reason: ${reason}`,
      data: {
        bookingId: booking._id,
        cancelledBy: userId
      }
    });

    // Send cancellation emails
    const mentor = await User.findById(booking.mentorId);
    const mentee = await User.findById(booking.menteeId);
    
    await sendEmail(
      mentor.email,
      ...Object.values(templates.bookingCancellation(booking, cancelledBy))
    );
    await sendEmail(
      mentee.email,
      ...Object.values(templates.bookingCancellation(booking, cancelledBy))
    );

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a booking
 * @route PUT /api/v1/bookings/:id/complete
 */
const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentorId = req.user.id;
    const { recordingUrl } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw createError(404, 'Booking not found');
    }

    if (booking.mentorId.toString() !== mentorId) {
      throw createError(403, 'Not authorized to complete this booking');
    }

    if (booking.status !== 'confirmed') {
      throw createError(400, `Booking cannot be completed (current status: ${booking.status})`);
    }

    // Complete booking
    await booking.complete(recordingUrl);

    // Create notification
    await Notification.create({
      userId: booking.menteeId,
      type: 'session_completed',
      title: 'Session Completed',
      body: 'Your session has ended. Please provide feedback.',
      data: {
        bookingId: booking._id,
        recordingUrl
      }
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add feedback to a booking
 * @route PUT /api/v1/bookings/:id/feedback
 */
const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw createError(404, 'Booking not found');
    }

    // Determine if user is mentor or mentee
    const userType = booking.mentorId.toString() === userId ? 'mentor' : 'mentee';
    if (userType === 'mentee' && booking.menteeId.toString() !== userId) {
      throw createError(403, 'Not authorized to add feedback to this booking');
    }

    if (booking.status !== 'completed') {
      throw createError(400, 'Can only add feedback to completed bookings');
    }

    // Add feedback
    await booking.addFeedback(userType, rating, comment);

    // Update mentor's rating if mentee feedback
    if (userType === 'mentee') {
      const mentorProfile = await MentorProfile.findOne({ userId: booking.mentorId });
      await mentorProfile.updateRating(rating);

      // Create notification for mentor
      await Notification.create({
        userId: booking.mentorId,
        type: 'feedback_received',
        title: 'New Feedback Received',
        body: `You received a ${rating}-star rating for your session`,
        data: {
          bookingId: booking._id,
          rating
        }
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List bookings
 * @route GET /api/v1/bookings
 */
const listBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      role, // 'mentor' or 'mentee'
      status,
      from,
      to,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by role
    if (role === 'mentor') {
      query.mentorId = userId;
    } else if (role === 'mentee') {
      query.menteeId = userId;
    } else {
      throw createError(400, 'Invalid role specified');
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (from || to) {
      query.scheduledAt = {};
      if (from) query.scheduledAt.$gte = new Date(from);
      if (to) query.scheduledAt.$lte = new Date(to);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('mentorId', 'name avatarUrl')
      .populate('menteeId', 'name avatarUrl');

    // Get total count
    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details
 * @route GET /api/v1/bookings/:id
 */
const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('mentorId', 'name email avatarUrl')
      .populate('menteeId', 'name email avatarUrl');

    if (!booking) {
      throw createError(404, 'Booking not found');
    }

    // Check authorization
    if (booking.mentorId._id.toString() !== userId && 
        booking.menteeId._id.toString() !== userId) {
      throw createError(403, 'Not authorized to view this booking');
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  addFeedback,
  listBookings,
  getBooking
};
