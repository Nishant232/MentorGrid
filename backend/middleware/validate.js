const { validationResult } = require('express-validator');
const { createError } = require('../utils/error');

/**
 * Middleware to validate request using express-validator rules
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format errors for client
      const formattedErrors = errors.array().reduce((acc, err) => {
        if (!acc[err.param]) {
          acc[err.param] = [];
        }
        acc[err.param].push(err.msg);
        return acc;
      }, {});

      return next(createError(400, 'Validation failed', { errors: formattedErrors }));
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth related schemas
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('role')
      .isIn(['mentor', 'mentee'])
      .withMessage('Invalid role')
  ],

  // Profile related schemas
  mentorProfile: [
    body('headline')
      .trim()
      .isLength({ min: 10, max: 100 })
      .withMessage('Headline must be between 10 and 100 characters'),
    body('bio')
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Bio must be between 50 and 1000 characters'),
    body('expertise')
      .isArray()
      .withMessage('Expertise must be an array')
      .custom(value => value.length > 0)
      .withMessage('At least one expertise is required'),
    body('hourlyRate')
      .isNumeric()
      .withMessage('Hourly rate must be a number')
  ],

  // Booking related schemas
  createBooking: [
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
      .withMessage('Duration must be between 15 and 180 minutes')
  ],

  // Message related schemas
  sendMessage: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    body('threadId')
      .notEmpty()
      .withMessage('Thread ID is required')
  ]
};

module.exports = {
  validate,
  schemas
};
