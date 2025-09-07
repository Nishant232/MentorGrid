const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate(schemas.register),
  authController.register
);

/**
 * @route POST /api/v1/auth/verify-otp
 * @desc Verify email with OTP
 * @access Public
 */
router.post(
  '/verify-otp',
  validate([
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('otpCode')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Invalid OTP format')
  ]),
  authController.verifyOtp
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  authController.login
);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh-token',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ]),
  authController.refreshToken
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Invalid email')
  ]),
  authController.forgotPassword
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number')
  ]),
  authController.resetPassword
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Protected
 */
router.post('/logout', auth, authController.logout);

/**
 * @route POST /api/v1/auth/resend-otp
 * @desc Resend verification OTP
 * @access Public
 */
router.post(
  '/resend-otp',
  validate([
    body('userId').isMongoId().withMessage('Invalid user ID')
  ]),
  authController.resendOtp
);

module.exports = router;
