const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: String,
                price: Number,
                qty: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],

        addressSnapshot: {
            type: Object,
            required: true,
        },

        paymentMode: {
            type: String,
            enum: ['COD', 'ONLINE'],
            required: true,
        },

        status: {
            type: String,
            required: true,
        },

        deliveryBoyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        orderSource: {
            type: String,
            enum: ['MANUAL', 'SUBSCRIPTION'],
            default: 'MANUAL',
        },

        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            default: null,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        timeline: [
            {
                state: String,
                at: Date,
                by: String,
            },
        ],
    },
    { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ deliveryBoyId: 1, status: 1 });
orderSchema.index({ subscriptionId: 1 });

module.exports = mongoose.model('Order', orderSchema);
