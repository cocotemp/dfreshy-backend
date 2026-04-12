const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        // TODO: Add product fields - name, price, category, etc.

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

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
