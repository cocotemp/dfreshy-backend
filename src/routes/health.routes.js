const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;

    const healthStatus = {
        service: 'coco-backend',
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            connected: isConnected,
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
        },
        requestId: req.requestId,
    };

    const statusCode = isConnected ? 200 : 503;
    res.status(statusCode).json(healthStatus);
});

module.exports = router;
