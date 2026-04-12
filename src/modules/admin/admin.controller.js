const User = require('../../models/user.model');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const { ROLES } = require('../../config/constants');
const response = require('../../utils/response');

const manageUsers = async (req, res, next) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        response.success(res, { users, total }, 'Users fetched successfully');
    } catch (error) {
        next(error);
    }
};

const assignRole = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-__v');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        response.success(res, { user }, 'Role assigned successfully');
    } catch (error) {
        next(error);
    }
};

const toggleUserStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.status = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        await user.save();
        response.success(res, { user }, `User ${user.status.toLowerCase()} successfully`);
    } catch (error) {
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const [totalUsers, totalOrders, totalProducts] = await Promise.all([
            User.countDocuments(),
            Order.countDocuments(),
            Product.countDocuments({ isActive: true }),
        ]);

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        response.success(res, {
            totalUsers,
            totalOrders,
            totalProducts,
            ordersByStatus,
        }, 'Analytics fetched successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    manageUsers,
    assignRole,
    toggleUserStatus,
    getAnalytics,
};
