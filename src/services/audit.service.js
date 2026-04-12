const Audit = require('../models/audit.model');

const logEvent = ({ actorId, actorRole, action, entityType, entityId, source, requestId, meta }) => {
    setImmediate(async () => {
        try {
            await Audit.create({
                actorId,
                actorRole,
                action,
                entityType,
                entityId,
                source,
                requestId,
                meta: meta || {},
            });
        } catch (err) {
            // Swallow error - audit must never block business flow
        }
    });
};

module.exports = {
    logEvent,
};
