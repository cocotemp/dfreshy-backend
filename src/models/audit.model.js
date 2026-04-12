const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        actorRole: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        entityType: {
            type: String,
            required: true,
            enum: ['ORDER', 'PRODUCT', 'PAYMENT', 'USER'],
        },
        entityId: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        source: {
            type: String,
            required: true,
            enum: ['API', 'SYSTEM', 'ADMIN'],
        },
        requestId: {
            type: String,
            required: true,
        },
        meta: {
            type: Object,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

const Audit = mongoose.model('Audit', auditSchema);

module.exports = Audit;
