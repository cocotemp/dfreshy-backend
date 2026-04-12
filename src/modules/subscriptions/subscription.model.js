const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        frequency: {
            type: String,
            enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
            required: true,
        },

        deliveryDays: {
            type: [Number],
            default: [],
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            default: null,
        },

        nextDeliveryDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'],
            default: 'ACTIVE',
        },

        pauseHistory: {
            type: [
                {
                    pausedAt: Date,
                    resumedAt: Date,
                },
            ],
            default: [],
        },

        createdBy: {
            type: String,
            enum: ['CUSTOMER', 'SYSTEM'],
            default: 'CUSTOMER',
        },

        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
