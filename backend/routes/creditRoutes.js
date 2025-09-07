const express = require('express');
const { body, query } = require('express-validator');
const creditController = require('../controllers/creditController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route POST /api/v1/credits/purchase
 * @desc Purchase credits
 * @access Private
 */
router.post(
  '/purchase',
  validate([
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Invalid amount'),
    body('paymentMethod')
      .isIn(['stripe', 'paypal'])
      .withMessage('Invalid payment method'),
    body('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Invalid credit quantity')
  ]),
  creditController.purchaseCredits
);

/**
 * @route POST /api/v1/credits/use
 * @desc Use credits for booking
 * @access Private
 */
router.post(
  '/use',
  validate([
    body('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('mentorId')
      .isMongoId()
      .withMessage('Invalid mentor ID'),
    body('creditsRequired')
      .isInt({ min: 1 })
      .withMessage('Invalid credit amount')
  ]),
  creditController.useCredits
);

/**
 * @route POST /api/v1/credits/refund
 * @desc Refund credits
 * @access Private (Admin only)
 */
router.post(
  '/refund',
  roleCheck('admin'),
  validate([
    body('bookingId')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    body('amount')
      .isInt({ min: 1 })
      .withMessage('Invalid refund amount'),
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required')
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ]),
  creditController.refundCredits
);

/**
 * @route GET /api/v1/credits/history
 * @desc Get credit history
 * @access Private
 */
router.get(
  '/history',
  validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid page number'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Invalid limit'),
    query('type')
      .optional()
      .isIn(['purchase', 'use', 'refund'])
      .withMessage('Invalid transaction type')
  ]),
  creditController.getCreditHistory
);

/**
 * @route GET /api/v1/credits/payout/calculate
 * @desc Calculate mentor payout
 * @access Private (Mentors only)
 */
router.get(
  '/payout/calculate',
  roleCheck('mentor'),
  validate([
    query('startDate')
      .isISO8601()
      .withMessage('Invalid start date'),
    query('endDate')
      .isISO8601()
      .withMessage('Invalid end date')
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ]),
  creditController.calculatePayout
);

/**
 * @route POST /api/v1/credits/payout/process
 * @desc Process mentor payout
 * @access Private (Mentors only)
 */
router.post(
  '/payout/process',
  roleCheck('mentor'),
  validate([
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Invalid payout amount'),
    body('paymentMethod')
      .isIn(['bank_transfer', 'paypal'])
      .withMessage('Invalid payment method'),
    body('bookings')
      .isArray()
      .withMessage('Bookings must be an array')
      .custom(bookings => bookings.every(id => /^[0-9a-fA-F]{24}$/.test(id)))
      .withMessage('Invalid booking IDs')
  ]),
  creditController.processPayout
);

module.exports = router;
