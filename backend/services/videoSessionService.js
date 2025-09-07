const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const Booking = require('../models/Booking');
const NotificationService = require('./notificationService');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class VideoSessionService {
  /**
   * Generate Agora token for a session
   * @param {Object} params Token parameters
   * @returns {Object} Token and channel information
   */
  static generateToken({
    userId,
    channelName,
    role = 'publisher',
    expirationTimeInSeconds = 3600
  }) {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const userRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      userId,
      userRole,
      privilegeExpiredTs
    );

    return {
      token,
      channelName,
      uid: userId,
      role,
      privilegeExpiredTs
    };
  }

  /**
   * Initialize a video session
   * @param {Object} params Session parameters
   * @returns {Object} Session details
   */
  static async initializeSession({
    bookingId,
    userId
  }) {
    // Verify booking exists and user is authorized
    const booking = await Booking.findById(bookingId)
      .populate('mentor', 'name email')
      .populate('mentee', 'name email');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'confirmed') {
      throw new ForbiddenError('Session is not confirmed');
    }

    const isParticipant = [
      booking.mentor._id.toString(),
      booking.mentee._id.toString()
    ].includes(userId);

    if (!isParticipant) {
      throw new ForbiddenError('Not authorized to join this session');
    }

    // Generate unique channel name using booking ID
    const channelName = `session_${bookingId}`;

    // Generate token for the user
    const tokenData = this.generateToken({
      userId,
      channelName,
      role: 'publisher'
    });

    // Update booking with session info
    await Booking.findByIdAndUpdate(bookingId, {
      'session.channelName': channelName,
      'session.startedAt': new Date(),
      status: 'in-progress'
    });

    // Notify other participant
    const otherParticipant = userId === booking.mentor._id.toString()
      ? booking.mentee
      : booking.mentor;

    await NotificationService.send({
      recipient: otherParticipant._id,
      type: 'SESSION_STARTED',
      title: 'Session Started',
      message: `Your session with ${userId === booking.mentor._id.toString() ? booking.mentor.name : booking.mentee.name} has started`,
      data: {
        bookingId,
        channelName
      }
    });

    return {
      ...tokenData,
      sessionInfo: {
        topic: booking.topic,
        duration: booking.durationMinutes,
        mentor: {
          id: booking.mentor._id,
          name: booking.mentor.name
        },
        mentee: {
          id: booking.mentee._id,
          name: booking.mentee.name
        }
      }
    };
  }

  /**
   * End a video session
   * @param {Object} params Session parameters
   * @returns {Object} Updated booking
   */
  static async endSession({
    bookingId,
    userId,
    recordingUrl = null
  }) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'in-progress') {
      throw new ForbiddenError('Session is not in progress');
    }

    if (userId !== booking.mentor._id.toString()) {
      throw new ForbiddenError('Only mentor can end the session');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'completed',
        'session.endedAt': new Date(),
        'session.recordingUrl': recordingUrl,
        'session.duration': Math.floor(
          (new Date() - booking.session.startedAt) / (1000 * 60)
        )
      },
      { new: true }
    );

    // Notify participants
    await Promise.all([
      NotificationService.send({
        recipient: booking.mentor._id,
        type: 'SESSION_COMPLETED',
        title: 'Session Completed',
        message: 'Your session has ended. Please submit your feedback.',
        data: {
          bookingId,
          recordingUrl
        }
      }),
      NotificationService.send({
        recipient: booking.mentee._id,
        type: 'SESSION_COMPLETED',
        title: 'Session Completed',
        message: 'Your session has ended. Please submit your feedback.',
        data: {
          bookingId,
          recordingUrl
        }
      })
    ]);

    return updatedBooking;
  }

  /**
   * Record technical issues during session
   * @param {Object} params Issue parameters
   * @returns {Object} Updated booking
   */
  static async reportTechnicalIssue({
    bookingId,
    userId,
    issue,
    timestamp
  }) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isParticipant = [
      booking.mentor._id.toString(),
      booking.mentee._id.toString()
    ].includes(userId);

    if (!isParticipant) {
      throw new ForbiddenError('Not authorized to report issues for this session');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $push: {
          'session.technicalIssues': {
            reportedBy: userId,
            issue,
            timestamp
          }
        }
      },
      { new: true }
    );

    // Notify support if there are multiple issues
    if (updatedBooking.session.technicalIssues.length >= 3) {
      // Implement support notification logic here
    }

    return updatedBooking;
  }

  /**
   * Get session recordings
   * @param {Object} params Query parameters
   * @returns {Array} Session recordings
   */
  static async getSessionRecordings({
    bookingId,
    userId
  }) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isParticipant = [
      booking.mentor._id.toString(),
      booking.mentee._id.toString()
    ].includes(userId);

    if (!isParticipant) {
      throw new ForbiddenError('Not authorized to access session recordings');
    }

    return {
      recordingUrl: booking.session.recordingUrl,
      duration: booking.session.duration,
      startedAt: booking.session.startedAt,
      endedAt: booking.session.endedAt
    };
  }
}

module.exports = VideoSessionService;
