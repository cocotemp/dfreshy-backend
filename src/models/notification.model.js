const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['CUSTOMER', 'MANAGER', 'DELIVERY', 'ADMIN'],
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        eventType: {
            type: String,
            required: true,
        },
        entityType: {
            type: String,
            required: true,
            enum: ['ORDER', 'PAYMENT', 'PRODUCT', 'USER'],
        },
        entityId: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
