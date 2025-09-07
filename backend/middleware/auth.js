const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/error');
const logger = require('../utils/logger');

/**
 * Authentication middleware that verifies JWT tokens
 * Extracts token from Authorization header and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw createError(401, 'No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id)
        .select('-password -otp -refreshToken')
        .lean();
      
      if (!user) {
        throw createError(401, 'User not found');
      }

      if (!user.isVerified) {
        throw createError(401, 'Email not verified');
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createError(401, 'Token expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw createError(401, 'Invalid token');
      }
      throw err;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(error);
  }
};

module.exports = auth;
