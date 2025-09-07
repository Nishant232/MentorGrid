const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

class FeedbackService {
  /**
   * Submit session feedback
   * @param {Object} params Feedback parameters
   * @returns {Object} Created review
   */
  static async submitSessionFeedback({
    bookingId,
    userId,
    rating,
    comment,
    mentorId,
    feedbackType,
    tags = []
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify booking exists and is completed
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      if (booking.status !== 'completed') {
        throw new ForbiddenError('Can only review completed sessions');
      }

      // Check if user is authorized to submit feedback
      if (feedbackType === 'mentor' && booking.mentee.toString() !== userId) {
        throw new ForbiddenError('Only mentee can review mentor');
      }
      if (feedbackType === 'mentee' && booking.mentor.toString() !== userId) {
        throw new ForbiddenError('Only mentor can review mentee');
      }

      // Create review
      const review = await Review.create([{
        booking: bookingId,
        reviewer: userId,
        reviewee: mentorId,
        rating,
        comment,
        type: feedbackType,
        tags,
        status: 'pending'
      }], { session });

      // Update booking with review reference
      if (feedbackType === 'mentor') {
        await Booking.findByIdAndUpdate(
          bookingId,
          { menteeReview: review[0]._id },
          { session }
        );
      } else {
        await Booking.findByIdAndUpdate(
          bookingId,
          { mentorReview: review[0]._id },
          { session }
        );
      }

      // Update mentor's average rating
      if (feedbackType === 'mentor') {
        const mentorReviews = await Review.aggregate([
          {
            $match: {
              reviewee: mongoose.Types.ObjectId(mentorId),
              type: 'mentor',
              status: 'approved'
            }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]).session(session);

        if (mentorReviews.length > 0) {
          await User.findByIdAndUpdate(
            mentorId,
            {
              'mentorProfile.rating': mentorReviews[0].averageRating,
              'mentorProfile.reviewCount': mentorReviews[0].totalReviews
            },
            { session }
          );
        }
      }

      await session.commitTransaction();

      // Notify reviewee about new feedback
      await NotificationService.send({
        recipient: mentorId,
        type: 'FEEDBACK_RECEIVED',
        title: 'New Session Feedback',
        message: `You've received new feedback for your session on ${booking.scheduledAt.toLocaleDateString()}`,
        data: {
          bookingId,
          rating,
          reviewId: review[0]._id
        }
      });

      return review[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Moderate review
   * @param {Object} params Moderation parameters
   * @returns {Object} Updated review
   */
  static async moderateReview({
    reviewId,
    status,
    moderationNotes
  }) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status,
        moderationNotes,
        moderatedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Notify reviewer about moderation result
    await NotificationService.send({
      recipient: review.reviewer,
      type: 'FEEDBACK_MODERATED',
      title: 'Feedback Moderation Update',
      message: `Your feedback has been ${status}`,
      data: {
        reviewId: review._id,
        status
      }
    });

    return review;
  }

  /**
   * Get mentor reviews
   * @param {Object} params Query parameters
   * @returns {Object} Reviews with pagination
   */
  static async getMentorReviews({
    mentorId,
    status = 'approved',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc'
  }) {
    const query = {
      reviewee: mentorId,
      type: 'mentor',
      status
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reviewer', 'name avatar')
        .populate('booking', 'scheduledAt topic'),
      Review.countDocuments(query)
    ]);

    return {
      reviews,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get user's submitted reviews
   * @param {Object} params Query parameters
   * @returns {Object} Reviews with pagination
   */
  static async getUserReviews({
    userId,
    type,
    page = 1,
    limit = 10
  }) {
    const query = {
      reviewer: userId,
      ...(type && { type })
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reviewee', 'name avatar expertise')
        .populate('booking', 'scheduledAt topic'),
      Review.countDocuments(query)
    ]);

    return {
      reviews,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get review statistics
   * @param {string} mentorId Mentor ID
   * @returns {Object} Review statistics
   */
  static async getReviewStatistics(mentorId) {
    const stats = await Review.aggregate([
      {
        $match: {
          reviewee: mongoose.Types.ObjectId(mentorId),
          type: 'mentor',
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          },
          tagFrequency: {
            $push: '$tags'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: 1,
          ratingDistribution: {
            1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
            2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
            3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
            4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
            5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
          }
        }
      }
    ]);

    if (!stats.length) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    return stats[0];
  }
}

module.exports = FeedbackService;
