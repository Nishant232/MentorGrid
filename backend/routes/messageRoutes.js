const express = require('express');
const { body, param, query } = require('express-validator');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route POST /api/v1/messages
 * @desc Send a new message
 * @access Private
 */
router.post(
  '/',
  validate([
    body('receiverId')
      .isMongoId()
      .withMessage('Invalid receiver ID'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: 2000 })
      .withMessage('Message cannot exceed 2000 characters'),
    body('bookingId')
      .optional()
      .isMongoId()
      .withMessage('Invalid booking ID')
  ]),
  messageController.sendMessage
);

/**
 * @route GET /api/v1/messages/conversations/:userId
 * @desc Get conversation history with a specific user
 * @access Private
 */
router.get(
  '/conversations/:userId',
  validate([
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Invalid limit')
  ]),
  messageController.getConversation
);

/**
 * @route GET /api/v1/messages/conversations
 * @desc Get list of all conversations
 * @access Private
 */
router.get(
  '/conversations',
  messageController.listConversations
);

/**
 * @route DELETE /api/v1/messages/:messageId
 * @desc Delete a message
 * @access Private (sender only)
 */
router.delete(
  '/:messageId',
  validate([
    param('messageId')
      .isMongoId()
      .withMessage('Invalid message ID')
  ]),
  messageController.deleteMessage
);

/**
 * @route GET /api/v1/messages/unread
 * @desc Get unread message count
 * @access Private
 */
router.get(
  '/unread',
  messageController.getUnreadCount
);

module.exports = router;
