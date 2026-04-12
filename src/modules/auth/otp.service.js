const crypto = require('crypto');

const store = new Map(); // phone -> { hash, expiresAt }

const generateOTP = (phone) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    store.set(phone, { hash, expiresAt });

    return otp; // later you will send via SMS
};

const verifyOTP = (phone, otp) => {
    const record = store.get(phone);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
        store.delete(phone);
        return false;
    }

    const otpStr = String(otp); // FORCE STRING
    const hash = crypto.createHash('sha256').update(otpStr).digest('hex');

    if (hash !== record.hash) return false;

    store.delete(phone);
    return true;
};

module.exports = {
    generateOTP,
    verifyOTP,
};
