const logger = require('../utils/logger');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = new AppError('Resource not found', 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        error = new AppError('Duplicate field value', 409);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = new AppError(messages.join(', '), 400);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    const response = {
        success: false,
        message,
    };

    // Include stack trace in development
    if (env.nodeEnv === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
