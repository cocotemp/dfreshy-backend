const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: 'ACTIVE',
        },
        deviceId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Indexes for performance
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, status: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
