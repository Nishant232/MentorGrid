const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

// Common date validation middleware
const dateValidation = [
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
];

/**
 * @route GET /api/v1/analytics/users
 * @desc Get user growth analytics
 * @access Private (Admin)
 */
router.get(
  '/users',
  validate([
    ...dateValidation,
    query('role')
      .optional()
      .isIn(['mentor', 'mentee', 'admin'])
      .withMessage('Invalid role')
  ]),
  analyticsController.getUserAnalytics
);

/**
 * @route GET /api/v1/analytics/bookings
 * @desc Get booking analytics
 * @access Private (Admin)
 */
router.get(
  '/bookings',
  validate(dateValidation),
  analyticsController.getBookingAnalytics
);

/**
 * @route GET /api/v1/analytics/engagement
 * @desc Get engagement analytics
 * @access Private (Admin)
 */
router.get(
  '/engagement',
  validate(dateValidation),
  analyticsController.getEngagementAnalytics
);

/**
 * @route GET /api/v1/analytics/financial
 * @desc Get financial analytics
 * @access Private (Admin)
 */
router.get(
  '/financial',
  validate(dateValidation),
  analyticsController.getFinancialAnalytics
);

/**
 * @route GET /api/v1/analytics/mentors
 * @desc Get mentor performance analytics
 * @access Private (Admin)
 */
router.get(
  '/mentors',
  validate([
    ...dateValidation,
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  analyticsController.getMentorAnalytics
);

/**
 * @route GET /api/v1/analytics/platform-health
 * @desc Get platform health dashboard
 * @access Private (Admin)
 */
router.get(
  '/platform-health',
  analyticsController.getPlatformHealth
);

/**
 * @route GET /api/v1/analytics/export
 * @desc Export analytics data
 * @access Private (Admin)
 */
router.get(
  '/export',
  validate([
    ...dateValidation,
    query('metrics')
      .isArray()
      .withMessage('metrics must be an array')
      .custom(metrics => metrics.every(m => 
        ['users', 'bookings', 'engagement', 'financial', 'mentors'].includes(m)
      ))
      .withMessage('Invalid metrics requested'),
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Invalid export format')
  ]),
  analyticsController.exportAnalytics
);

module.exports = router;
