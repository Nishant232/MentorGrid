const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).reduce((acc, error) => {
      if (!acc[error.path]) {
        acc[error.path] = [];
      }
      acc[error.path].push(error.message);
      return acc;
    }, {});
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // Duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    const field = Object.keys(err.keyValue)[0];
    errors = {
      [field]: [`${field} already exists`]
    };
  } else if (err.name === 'CastError') {
    // Invalid ID error
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MulterError') {
    // File upload error
    statusCode = 400;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
