const { createError } = require('../utils/error');

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, `Access denied. ${req.user.role} cannot access this resource`)
      );
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own resources
 * @param {string} paramName - URL parameter containing the resource owner's ID
 */
const ownershipCheck = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceOwnerId = req.params[paramName];
    if (resourceOwnerId !== req.user.id) {
      return next(
        createError(403, 'Access denied. You can only access your own resources')
      );
    }

    next();
  };
};

/**
 * Combined middleware for role and ownership checking
 * @param {string[]} roles - Allowed roles
 * @param {string} paramName - URL parameter for ownership check
 */
const authGuard = (roles, paramName) => {
  return [roleCheck(...roles), ownershipCheck(paramName)];
};

module.exports = {
  roleCheck,
  ownershipCheck,
  authGuard
};
