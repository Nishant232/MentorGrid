const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const { ForbiddenError } = require('../utils/errors');

/**
 * Get user's notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const userId = req.user.id;

  const query = { recipient: userId };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCount = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false
  });

  res.status(200).json({
    status: 'success',
    data: {
      notifications,
      totalCount,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markAsRead = async (req, res) => {
  const { notificationIds } = req.body;
  const userId = req.user.id;

  await NotificationService.markAsRead(userId, notificationIds);

  res.status(200).json({
    status: 'success',
    message: 'Notifications marked as read'
  });
};

/**
 * Delete notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteNotifications = async (req, res) => {
  const { notificationIds } = req.body;
  const userId = req.user.id;

  await NotificationService.deleteNotifications(userId, notificationIds);

  res.status(204).send();
};

/**
 * Update notification preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updatePreferences = async (req, res) => {
  const { preferences } = req.body;
  const userId = req.user.id;

  await User.findByIdAndUpdate(userId, {
    notificationPreferences: preferences
  });

  res.status(200).json({
    status: 'success',
    message: 'Notification preferences updated'
  });
};

/**
 * Send system announcement (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendAnnouncement = async (req, res) => {
  const { title, message, userGroups, priority, expiresAt, actionUrl } = req.body;

  // Only admins can send announcements
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Only administrators can send announcements');
  }

  await NotificationService.sendAnnouncement({
    title,
    message,
    userGroups,
    priority,
    expiresAt,
    actionUrl
  });

  res.status(201).json({
    status: 'success',
    message: 'Announcement sent successfully'
  });
};
