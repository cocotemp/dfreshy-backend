const { ForbiddenError } = require('../utils/errors');

/**
 * Role enforcement middleware factory
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated
            if (!req.user || !req.user.role) {
                throw new ForbiddenError('User role not found');
            }

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = requireRole;
