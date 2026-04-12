const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0.01,
        },

        unit: {
            type: String,
            required: true,
            enum: ['piece', 'bundle', 'liter', 'kg', 'dozen'],
            default: 'piece',
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        availableStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        reservedStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        damagedStock: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

productSchema.index({ isActive: 1 });
productSchema.index({ availableStock: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
