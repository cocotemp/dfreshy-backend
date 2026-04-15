const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const otpService = require('./otp.service');
const smsService = require('../../services/sms.service');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { UnauthorizedError } = require('../../utils/errors');
const { ROLES } = require('../../config/constants');

const sendOTP = async (phone) => {
    // 1. Generate OTP and store in memory with hash + expiry
    const otp = otpService.generateOTP(phone);
    const message = `Your dFreshy OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;

    // 2. In production: send real SMS via Fast2SMS
    if (process.env.NODE_ENV === 'production') {
        const result = await smsService.sendSMS(phone, message);
        if (!result.sent) {
            // Log the failure but DO NOT crash — OTP is still stored, user can retry
            logger.warn(`[OTP] SMS delivery failed for ${phone}: ${result.info}`);
            // In production, still return success=true (security: don't reveal SMS status)
            // But if the key is totally missing, inform the developer
            if (!process.env.FAST2SMS_API_KEY) {
                return { success: false, message: 'SMS service not configured. Contact support.' };
            }
        }
        logger.info(`[OTP] SMS sent to ${phone}`);
        return { success: true };
    }

    // 3. Development/staging: try SMS if key is set, else fall back to response OTP
    if (process.env.FAST2SMS_API_KEY) {
        const result = await smsService.sendSMS(phone, message);
        logger.info(`[DEV] SMS result for ${phone}: ${JSON.stringify(result)}`);
        // Still return OTP in response for dev convenience
        return { success: true, otp, smsSent: result.sent };
    }

    // 4. No SMS key in dev — return OTP directly so frontend shows it
    logger.info(`[DEV] OTP for ${phone}: ${otp} (no SMS key set)`);
    return { success: true, otp };
};

const verifyOTP = async ({ phone, otp, deviceId }) => {
    const isValid = otpService.verifyOTP(phone, otp);
    if (!isValid) {
        throw new UnauthorizedError('Invalid or expired OTP');
    }

    let user = await User.findOne({ phone });

    if (!user) {
        user = await User.create({
            phone,
            role: ROLES.CUSTOMER,
            status: 'ACTIVE',
        });
    }

    if (!user.status) {
        user.status = 'ACTIVE';
        await user.save();
    }

    if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('User is blocked');
    }


    if (user.role === ROLES.DELIVERY) {
        if (!deviceId) {
            throw new UnauthorizedError('Device ID required');
        }

        if (!user.deviceId) {
            user.deviceId = deviceId;
            await user.save();
        } else if (user.deviceId !== deviceId) {
            throw new UnauthorizedError('This account is bound to another device');
        }
    }

    const token = jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
            phone: user.phone,
        },
        env.jwt.secret,
        {
            expiresIn:
                user.role === ROLES.CUSTOMER
                    ? '30d'
                    : user.role === ROLES.DELIVERY
                        ? '12h'
                        : '24h',
        }
    );

    return {
        token,
        role: user.role,
    };
};

module.exports = {
    sendOTP,
    verifyOTP,
};
