const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
    const clientRequestId = req.headers['x-request-id'];

    if (clientRequestId) {
        req.requestId = clientRequestId;
    } else {
        req.requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    next();
};

module.exports = requestIdMiddleware;
