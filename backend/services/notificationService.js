const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const Queue = require('bull');
const logger = require('../utils/logger');

// Create notification queue
const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

// Process notification jobs
notificationQueue.process('sendNotification', async (job) => {
  try {
    const notification = await NotificationService.send(job.data);
    logger.info(`Processed scheduled notification: ${notification._id}`);
    return notification;
  } catch (error) {
    logger.error(`Failed to process scheduled notification: ${error.message}`);
    throw error;
  }
});

// Handle notification queue errors
notificationQueue.on('error', (error) => {
  logger.error(`Notification queue error: ${error.message}`);
});

notificationQueue.on('failed', (job, error) => {
  logger.error(`Notification job ${job.id} failed: ${error.message}`);
});

class NotificationService {
  /**
   * Create and send a notification
   * @param {Object} params Notification parameters
   */
  static async send({
    recipient,
    type,
    title,
    message,
    data = {},
    actionUrl,
    priority = 'normal',
    expiresAt = null,
    emailNotification = true
  }) {
    try {
      // Create notification
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        data,
        actionUrl,
        priority,
        expiresAt
      });

      // Get recipient's notification preferences
      const user = await User.findById(recipient).select('email notificationPreferences');
      
      // Send real-time notification via Socket.IO
      const io = global.io;
      if (io) {
        io.to(recipient.toString()).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          data,
          actionUrl,
          priority,
          createdAt: notification.createdAt
        });
      }

      // Send email notification if enabled in user preferences
      if (emailNotification && user?.notificationPreferences?.[type]?.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          template: `notifications/${type.toLowerCase()}`,
          context: {
            name: user.name,
            message,
            actionUrl,
            ...data
          }
        });
      }

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send multiple notifications
   * @param {Array} notifications Array of notification objects
   */
  static async sendBulk(notifications) {
    return Promise.all(notifications.map(notification => 
      this.send(notification)
    ));
  }

  /**
   * Send system announcement to all users or specific user groups
   * @param {Object} params Announcement parameters
   */
  static async sendAnnouncement({
    title,
    message,
    userGroups = ['all'],
    priority = 'normal',
    expiresAt = null,
    actionUrl = null
  }) {
    try {
      let query = {};
      if (!userGroups.includes('all')) {
        query.role = { $in: userGroups };
      }

      const users = await User.find(query).select('_id');
      const notifications = users.map(user => ({
        recipient: user._id,
        type: 'SYSTEM_ANNOUNCEMENT',
        title,
        message,
        priority,
        expiresAt,
        actionUrl
      }));

      return this.sendBulk(notifications);
    } catch (error) {
      console.error('Failed to send announcement:', error);
      throw error;
    }
  }

  /**
   * Send session reminder notifications
   * @param {Object} booking The booking object
   */
  static async sendSessionReminder(booking) {
    const reminderTimes = [24, 1]; // hours before session
    const currentTime = new Date();
    const sessionTime = new Date(booking.scheduledAt);

    for (const hours of reminderTimes) {
      const reminderTime = new Date(sessionTime.getTime() - hours * 60 * 60 * 1000);
      if (reminderTime > currentTime) {
        await this.scheduleNotification({
          recipient: booking.mentee,
          type: 'SESSION_REMINDER',
          title: `Reminder: Mentoring session in ${hours} hour${hours > 1 ? 's' : ''}`,
          message: `Your session with ${booking.mentor.name} is starting in ${hours} hour${hours > 1 ? 's' : ''}.`,
          data: { bookingId: booking._id },
          actionUrl: `/dashboard/sessions/${booking._id}`,
          scheduledFor: reminderTime
        });
      }
    }
  }

  /**
   * Schedule a notification for future delivery
   * @param {Object} params Notification parameters including scheduledFor
   */
  static async scheduleNotification({ scheduledFor, ...notificationParams }) {
    try {
      // Calculate delay in milliseconds
      const delay = scheduledFor.getTime() - Date.now();
      
      // Don't schedule if the time has already passed
      if (delay <= 0) {
        logger.warn('Attempted to schedule notification in the past, sending immediately');
        return this.send(notificationParams);
      }
      
      // Add to notification queue
      const job = await notificationQueue.add('sendNotification', notificationParams, {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute
        },
        removeOnComplete: true,
        removeOnFail: false
      });
      
      logger.info(`Scheduled notification job ${job.id} for ${scheduledFor.toISOString()}`);
      return job;
    } catch (error) {
      logger.error(`Failed to schedule notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param {String} userId User ID
   * @param {Array} notificationIds Array of notification IDs to mark as read
   */
  static async markAsRead(userId, notificationIds) {
    return Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId
      },
      { read: true }
    );
  }

  /**
   * Delete notifications
   * @param {String} userId User ID
   * @param {Array} notificationIds Array of notification IDs to delete
   */
  static async deleteNotifications(userId, notificationIds) {
    return Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: userId
    });
  }
}

module.exports = NotificationService;
