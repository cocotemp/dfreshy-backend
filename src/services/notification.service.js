const Notification = require('../models/notification.model');

const createNotification = ({ userId, role, title, message, eventType, entityType, entityId }) => {
    setImmediate(async () => {
        try {
            await Notification.create({
                userId,
                role,
                title,
                message,
                eventType,
                entityType,
                entityId,
            });
        } catch (err) {
            // Swallow error - notification failure must never block business flow
        }
    });
};

const getNotifications = async ({ userId, isRead, page = 1, limit = 20 }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { userId };
    if (typeof isRead !== 'undefined') {
        filter.isRead = isRead;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum);

    return {
        data: notifications,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            hasNext: pageNum * limitNum < total,
        },
    };
};

module.exports = {
    createNotification,
    getNotifications,
};
