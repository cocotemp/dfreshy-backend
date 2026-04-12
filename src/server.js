const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error(`Unhandled Rejection: ${error.message}`);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start listening
        const server = app.listen(env.port, () => {
            logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            // Force shutdown after 10 seconds
            const forceExitTimer = setTimeout(() => {
                logger.error('Graceful shutdown timeout exceeded. Forcing exit...');
                process.exit(1);
            }, 10000);

            server.close(async () => {
                logger.info('HTTP server closed. No new connections accepted.');
                logger.info('Waiting for existing requests to complete...');

                try {
                    // Close database connection
                    const mongoose = require('mongoose');
                    await mongoose.disconnect();
                    logger.info('Database connection closed successfully.');

                    logger.info('Graceful shutdown completed.');
                    clearTimeout(forceExitTimer);
                    process.exit(0);
                } catch (error) {
                    logger.error(`Error during shutdown: ${error.message}`);
                    clearTimeout(forceExitTimer);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
