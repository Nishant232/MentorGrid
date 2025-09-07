const express = require('express');
const { body, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route GET /api/v1/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get(
  '/',
  validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Invalid limit'),
    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('unreadOnly must be a boolean')
  ]),
  notificationController.getNotifications
);

/**
 * @route PUT /api/v1/notifications/read
 * @desc Mark notifications as read
 * @access Private
 */
router.put(
  '/read',
  validate([
    body('notificationIds')
      .isArray()
      .withMessage('notificationIds must be an array')
      .custom(ids => ids.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)))
      .withMessage('Invalid notification IDs')
  ]),
  notificationController.markAsRead
);

/**
 * @route DELETE /api/v1/notifications
 * @desc Delete notifications
 * @access Private
 */
router.delete(
  '/',
  validate([
    body('notificationIds')
      .isArray()
      .withMessage('notificationIds must be an array')
      .custom(ids => ids.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)))
      .withMessage('Invalid notification IDs')
  ]),
  notificationController.deleteNotifications
);

/**
 * @route PUT /api/v1/notifications/preferences
 * @desc Update notification preferences
 * @access Private
 */
router.put(
  '/preferences',
  validate([
    body('preferences')
      .isObject()
      .withMessage('preferences must be an object')
      .custom((prefs) => {
        const validTypes = [
          'BOOKING_REQUEST',
          'BOOKING_CONFIRMED',
          'BOOKING_CANCELLED',
          'SESSION_REMINDER',
          'NEW_MESSAGE',
          'FEEDBACK_RECEIVED',
          'SYSTEM_ANNOUNCEMENT',
          'CREDIT_ADDED',
          'CREDIT_DEDUCTED',
          'PAYOUT_PROCESSED'
        ];
        
        return Object.entries(prefs).every(([key, value]) => {
          return validTypes.includes(key) && 
            typeof value === 'object' &&
            typeof value.email === 'boolean' &&
            typeof value.push === 'boolean';
        });
      })
      .withMessage('Invalid notification preferences format')
  ]),
  notificationController.updatePreferences
);

/**
 * @route POST /api/v1/notifications/announcements
 * @desc Send system announcement (Admin only)
 * @access Private (Admin)
 */
router.post(
  '/announcements',
  roleCheck('admin'),
  validate([
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 100 })
      .withMessage('Title cannot exceed 100 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    body('userGroups')
      .optional()
      .isArray()
      .withMessage('userGroups must be an array')
      .custom(groups => groups.every(group => ['all', 'mentor', 'mentee', 'admin'].includes(group)))
      .withMessage('Invalid user groups'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high'])
      .withMessage('Invalid priority level'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date'),
    body('actionUrl')
      .optional()
      .isURL()
      .withMessage('Invalid action URL')
  ]),
  notificationController.sendAnnouncement
);

module.exports = router;
