const rateLimit = require('express-rate-limit');

const OTP_WINDOW_MS = Number(process.env.OTP_WINDOW_MS) || 10 * 60 * 1000;
const OTP_MAX = Number(process.env.OTP_MAX) || 5;

const ORDER_WINDOW_MS = Number(process.env.ORDER_WINDOW_MS) || 15 * 60 * 1000;
const ORDER_MAX = Number(process.env.ORDER_MAX) || 30;

const ACTION_WINDOW_MS = Number(process.env.ACTION_WINDOW_MS) || 15 * 60 * 1000;
const ACTION_MAX = Number(process.env.ACTION_MAX) || 100;

const responseMessage = {
    success: false,
    message: 'Too many requests. Please try again later.',
};

const otpLimiter = rateLimit({
    windowMs: OTP_WINDOW_MS,
    max: OTP_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: responseMessage,
});

const orderCreateLimiter = rateLimit({
    windowMs: ORDER_WINDOW_MS,
    max: ORDER_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: responseMessage,
});

const standardActionLimiter = rateLimit({
    windowMs: ACTION_WINDOW_MS,
    max: ACTION_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: responseMessage,
});

module.exports = {
    otpLimiter,
    orderCreateLimiter,
    standardActionLimiter,
};
