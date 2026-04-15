const authService = require('./auth.service');

const sendOTP = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const result = await authService.sendOTP(phone);
        res.json(result); // forwards { success: true } or { success: true, otp } in dev
    } catch (err) {
        next(err);
    }
};

const verifyOTP = async (req, res, next) => {
    try {
        const { phone, otp, deviceId } = req.body;
        const result = await authService.verifyOTP({ phone, otp, deviceId });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    return sendOTP(req, res, next);
};

const refreshToken = async (req, res) => {
    res.status(501).json({ message: 'Not implemented' });
};

module.exports = {
    sendOTP,
    verifyOTP,
    login,
    refreshToken,
};
