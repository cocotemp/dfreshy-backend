const mongoose = require('mongoose');

const codSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true,
        },
        deliveryBoyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amountDue: {
            type: Number,
            required: true,
            min: 0,
        },
        amountCollected: {
            type: Number,
            default: null,
            min: 0,
        },
        status: {
            type: String,
            enum: ['PENDING', 'COLLECTED', 'SETTLED', 'DISPUTED'],
            default: 'PENDING',
        },
        collectedAt: {
            type: Date,
            default: null,
        },
        settledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        settledAt: {
            type: Date,
            default: null,
        },
        discrepancy: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// Indexes for efficient queries
codSchema.index({ orderId: 1 });
codSchema.index({ deliveryBoyId: 1, status: 1 });
codSchema.index({ status: 1, createdAt: -1 });

const COD = mongoose.model('COD', codSchema);

module.exports = COD;
