const auditService = require('../services/audit.service');

const auditLog = (params) => {
    try {
        auditService.logEvent(params);
    } catch (err) {
        // Swallow error - audit must never block business flow
    }
};

module.exports = {
    auditLog,
};
