const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route GET /api/v1/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', userController.getCurrentUser);

/**
 * @route PUT /api/v1/users/me
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/me',
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    // Add role-specific validations based on user type
    body('headline')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Headline cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Bio cannot exceed 1000 characters'),
    body('expertise')
      .optional()
      .isArray()
      .withMessage('Expertise must be an array'),
    body('hourlyRate')
      .optional()
      .isNumeric()
      .withMessage('Hourly rate must be a number'),
    body('languages')
      .optional()
      .isArray()
      .withMessage('Languages must be an array')
  ]),
  userController.updateProfile
);

/**
 * @route POST /api/v1/users/me/avatar
 * @desc Upload user avatar
 * @access Private
 */
router.post('/me/avatar', userController.uploadAvatar);

/**
 * @route PUT /api/v1/users/me/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put(
  '/me/preferences',
  validate([
    body('timezone')
      .optional()
      .isString()
      .withMessage('Invalid timezone'),
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('emailNotifications must be boolean'),
    body('pushNotifications')
      .optional()
      .isBoolean()
      .withMessage('pushNotifications must be boolean')
  ]),
  userController.updatePreferences
);

/**
 * @route DELETE /api/v1/users/me
 * @desc Delete user account
 * @access Private
 */
router.delete(
  '/me',
  validate([
    body('password')
      .notEmpty()
      .withMessage('Password is required for account deletion')
  ]),
  userController.deleteAccount
);

module.exports = router;
