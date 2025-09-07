const express = require('express');
const { body, query, param } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route POST /api/v1/bookings
 * @desc Create a new booking
 * @access Private (Mentees only)
 */
router.post(
  '/',
  roleCheck('mentee'),
  validate([
    body('mentorId')
      .isMongoId()
      .withMessage('Invalid mentor ID'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom(value => new Date(value) > new Date())
      .withMessage('Booking date must be in the future'),
    body('durationMinutes')
      .isInt({ min: 15, max: 180 })
      .withMessage('Duration must be between 15 and 180 minutes'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ]),
  bookingController.createBooking
);

/**
 * @route PUT /api/v1/bookings/:id/confirm
 * @desc Confirm a booking
 * @access Private (Mentors only)
 */
router.put(
  '/:id/confirm',
  roleCheck('mentor'),
  validate([
    param('id')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('meetingLink')
      .isURL()
      .withMessage('Invalid meeting link')
  ]),
  bookingController.confirmBooking
);

/**
 * @route PUT /api/v1/bookings/:id/cancel
 * @desc Cancel a booking
 * @access Private (Both mentor and mentee)
 */
router.put(
  '/:id/cancel',
  validate([
    param('id')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Cancellation reason is required')
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ]),
  bookingController.cancelBooking
);

/**
 * @route PUT /api/v1/bookings/:id/complete
 * @desc Complete a booking
 * @access Private (Mentors only)
 */
router.put(
  '/:id/complete',
  roleCheck('mentor'),
  validate([
    param('id')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('recordingUrl')
      .optional()
      .isURL()
      .withMessage('Invalid recording URL')
  ]),
  bookingController.completeBooking
);

/**
 * @route PUT /api/v1/bookings/:id/feedback
 * @desc Add feedback to a booking
 * @access Private (Both mentor and mentee)
 */
router.put(
  '/:id/feedback',
  validate([
    param('id')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .notEmpty()
      .withMessage('Feedback comment is required')
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters')
  ]),
  bookingController.addFeedback
);

/**
 * @route GET /api/v1/bookings
 * @desc List bookings
 * @access Private
 */
router.get(
  '/',
  validate([
    query('role')
      .isIn(['mentor', 'mentee'])
      .withMessage('Invalid role'),
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
      .withMessage('Invalid status'),
    query('from')
      .optional()
      .isISO8601()
      .withMessage('Invalid from date'),
    query('to')
      .optional()
      .isISO8601()
      .withMessage('Invalid to date'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Invalid limit')
  ]),
  bookingController.listBookings
);

/**
 * @route GET /api/v1/bookings/:id
 * @desc Get booking details
 * @access Private (Mentor and mentee of the booking)
 */
router.get(
  '/:id',
  validate([
    param('id')
      .isMongoId()
      .withMessage('Invalid booking ID')
  ]),
  bookingController.getBooking
);

module.exports = router;
