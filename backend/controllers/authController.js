const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const MenteeProfile = require('../models/MenteeProfile');
const { createError } = require('../utils/error');
const { sendEmail, templates } = require('../utils/sendEmail');
const otp = require('../utils/otp');
const logger = require('../utils/logger');

/**
 * User registration controller
 * @route POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    // Create user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      name,
      role
    });

    // Generate and send OTP
    const generatedOtp = await otp.generateForUser(user);
    await user.save();

    // Create empty profile based on role
    if (role === 'mentor') {
      await MentorProfile.create({ userId: user._id });
    } else if (role === 'mentee') {
      await MenteeProfile.create({ userId: user._id });
    }

    // Send verification email
    await sendEmail(
      email,
      ...Object.values(templates.verifyEmail(name, generatedOtp))
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * OTP verification controller
 * @route POST /api/v1/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otpCode } = req.body;

    const user = await User.findById(userId).select('+otp');
    if (!user) {
      throw createError(404, 'User not found');
    }

    await otp.verify(user, otpCode);

    // Generate tokens after verification
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login controller
 * @route POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError(401, 'Invalid credentials');
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Generate new OTP and send email
      const newOtp = await otp.generateForUser(user);
      await sendEmail(
        email,
        ...Object.values(templates.verifyEmail(user.name, newOtp))
      );

      throw createError(403, 'Email not verified. New verification code sent.', {
        userId: user._id
      });
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          credits: user.credits,
          avatarUrl: user.avatarUrl
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token controller
 * @route POST /api/v1/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw createError(400, 'Refresh token required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw createError(401, 'Invalid refresh token');
    }

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password controller
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success even if user not found for security
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a reset link.'
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail(
      email,
      ...Object.values(templates.resetPassword(user.name, resetLink))
    );

    res.json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password controller
 * @route POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw createError(400, 'Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(createError(400, 'Reset token has expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Logout controller
 * @route POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Clear refresh token
    user.refreshToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP controller
 * @route POST /api/v1/auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    if (user.isVerified) {
      throw createError(400, 'Email already verified');
    }

    // Generate and send new OTP
    const newOtp = await otp.generateForUser(user);
    await sendEmail(
      user.email,
      ...Object.values(templates.verifyEmail(user.name, newOtp))
    );

    res.json({
      success: true,
      message: 'New verification code sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  resendOtp
};
