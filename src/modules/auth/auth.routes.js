const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { otpLimiter } = require('../../utils/rateLimiters');

// Public routes - no authentication required
router.post('/login', authController.login);
router.post('/send-otp', otpLimiter, authController.sendOTP);
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
