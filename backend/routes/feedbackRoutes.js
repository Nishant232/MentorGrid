const express = require('express');
const { body, param, query } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route POST /api/v1/feedback
 * @desc Submit session feedback
 * @access Private
 */
router.post(
  '/',
  validate([
    body('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .notEmpty()
      .withMessage('Feedback comment is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters'),
    body('mentorId')
      .isMongoId()
      .withMessage('Invalid mentor ID'),
    body('feedbackType')
      .isIn(['mentor', 'mentee'])
      .withMessage('Invalid feedback type'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom(tags => tags.every(tag => typeof tag === 'string' && tag.length <= 20))
      .withMessage('Invalid tags format')
  ]),
  feedbackController.submitFeedback
);

/**
 * @route PUT /api/v1/feedback/:reviewId/moderate
 * @desc Moderate a review
 * @access Private (Admin only)
 */
router.put(
  '/:reviewId/moderate',
  roleCheck('admin'),
  validate([
    param('reviewId')
      .isMongoId()
      .withMessage('Invalid review ID'),
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Invalid moderation status'),
    body('moderationNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Moderation notes cannot exceed 500 characters')
  ]),
  feedbackController.moderateReview
);

/**
 * @route GET /api/v1/feedback/mentor/:mentorId
 * @desc Get mentor reviews
 * @access Public
 */
router.get(
  '/mentor/:mentorId',
  validate([
    param('mentorId')
      .isMongoId()
      .withMessage('Invalid mentor ID'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Invalid limit'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'rating'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort order')
  ]),
  feedbackController.getMentorReviews
);

/**
 * @route GET /api/v1/feedback/user
 * @desc Get user's submitted reviews
 * @access Private
 */
router.get(
  '/user',
  validate([
    query('type')
      .optional()
      .isIn(['mentor', 'mentee'])
      .withMessage('Invalid feedback type'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Invalid limit')
  ]),
  feedbackController.getUserReviews
);

/**
 * @route GET /api/v1/feedback/stats/:mentorId
 * @desc Get mentor's review statistics
 * @access Public
 */
router.get(
  '/stats/:mentorId',
  validate([
    param('mentorId')
      .isMongoId()
      .withMessage('Invalid mentor ID')
  ]),
  feedbackController.getMentorStatistics
);

module.exports = router;
