const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');

const authenticate = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, env.jwt.secret);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            role: decoded.role,
            phone: decoded.phone,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token expired'));
        }
        next(error);
    }
};

module.exports = authenticate;
