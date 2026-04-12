const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const otpService = require('./otp.service');
const env = require('../../config/env');
const { UnauthorizedError } = require('../../utils/errors');
const { ROLES } = require('../../config/constants');

const sendOTP = async (phone) => {
    const otp = otpService.generateOTP(phone);

    // For now, just log it. Later integrate SMS.
    console.log(`OTP for ${phone}: ${otp}`);

    return true;
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
