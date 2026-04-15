require('dotenv').config();

const env = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coco-db',
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    },

    sms: {
        fast2smsKey: process.env.FAST2SMS_API_KEY, // loaded from Railway env vars
    },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

module.exports = env;
