const express = require('express');
const { body, param } = require('express-validator');
const videoSessionController = require('../controllers/videoSessionController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route POST /api/v1/video-sessions/:bookingId/initialize
 * @desc Initialize a video session
 * @access Private
 */
router.post(
  '/:bookingId/initialize',
  validate([
    param('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID')
  ]),
  videoSessionController.initializeSession
);

/**
 * @route POST /api/v1/video-sessions/:bookingId/end
 * @desc End a video session
 * @access Private (Mentor only)
 */
router.post(
  '/:bookingId/end',
  validate([
    param('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('recordingUrl')
      .optional()
      .isURL()
      .withMessage('Invalid recording URL')
  ]),
  videoSessionController.endSession
);

/**
 * @route POST /api/v1/video-sessions/:bookingId/issues
 * @desc Report technical issues
 * @access Private
 */
router.post(
  '/:bookingId/issues',
  validate([
    param('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('issue')
      .trim()
      .notEmpty()
      .withMessage('Issue description is required')
      .isLength({ max: 500 })
      .withMessage('Issue description cannot exceed 500 characters')
  ]),
  videoSessionController.reportIssue
);

/**
 * @route GET /api/v1/video-sessions/:bookingId/recordings
 * @desc Get session recordings
 * @access Private (Session participants only)
 */
router.get(
  '/:bookingId/recordings',
  validate([
    param('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID')
  ]),
  videoSessionController.getRecordings
);

module.exports = router;
