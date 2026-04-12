const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middlewares/error.middleware');
const requestIdMiddleware = require('./middlewares/requestId.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const logger = require('./utils/logger');
const { registerOrderEventHandlers } = require('./events/orderEvents.handler');

// Initialize event handlers
registerOrderEventHandlers();
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware
app.use(sanitizeMiddleware);

// Request ID middleware
app.use(requestIdMiddleware);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check (root level, for load balancers)
app.use('/health', healthRoutes);

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
