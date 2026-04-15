'use strict';

const https = require('https');
const logger = require('../utils/logger');

/**
 * Send an SMS via Fast2SMS Quick (DLT-free) route.
 *
 * @param {string} phone  - 10-digit Indian mobile number (no country code)
 * @param {string} message - Message text to send
 * @returns {Promise<{ sent: boolean, info?: string }>}
 */
const sendSMS = (phone, message) => {
    // Read at call-time (not module-load) so dotenv is already applied
    const apiKey = process.env.FAST2SMS_API_KEY;

    return new Promise((resolve) => {
        if (!apiKey) {
            logger.warn('[SMS] FAST2SMS_API_KEY not set — skipping SMS send');
            return resolve({ sent: false, info: 'API key not configured' });
        }

        const payload = JSON.stringify({
            route: 'q',        // Quick / instant route (no DLT required)
            message,
            numbers: phone,
            flash: 0,
        });

        const options = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.return === true) {
                        logger.info(`[SMS] Sent to ${phone} — request_id: ${parsed.request_id}`);
                        resolve({ sent: true, info: parsed.request_id });
                    } else {
                        logger.warn(`[SMS] Fast2SMS rejected: ${JSON.stringify(parsed)}`);
                        resolve({ sent: false, info: JSON.stringify(parsed) });
                    }
                } catch (e) {
                    logger.error(`[SMS] Failed to parse Fast2SMS response: ${data}`);
                    resolve({ sent: false, info: 'Invalid response from SMS provider' });
                }
            });
        });

        req.on('error', (err) => {
            logger.error(`[SMS] Network error: ${err.message}`);
            resolve({ sent: false, info: err.message }); // never reject — don't crash server
        });

        req.setTimeout(8000, () => {
            logger.error('[SMS] Fast2SMS request timed out');
            req.destroy();
            resolve({ sent: false, info: 'SMS provider timeout' });
        });

        req.write(payload);
        req.end();
    });
};

module.exports = { sendSMS };
