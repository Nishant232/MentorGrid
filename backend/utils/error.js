/**
 * Create a custom error with status code and optional data
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} [data] - Additional error data
 * @returns {Error} Custom error object
 */
const createError = (statusCode, message, data = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = data.errors;
  return error;
};

module.exports = {
  createError
};
