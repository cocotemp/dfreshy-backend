const customerService = require('./customer.service');
const response = require('../../utils/response');

const getProfile = async (req, res, next) => {
    try {
        const profile = await customerService.getProfileById(req.user.id);
        response.success(res, { profile }, 'Profile fetched successfully');
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const profile = await customerService.updateProfile(req.user.id, req.body);
        response.success(res, { profile }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const orders = await customerService.getOrders(req.user.id, { page, limit, status });
        response.success(res, orders, 'Orders fetched successfully');
    } catch (error) {
        next(error);
    }
};

const getSubscriptions = async (req, res, next) => {
    try {
        // Subscriptions are a future feature — return empty for now
        response.success(res, { subscriptions: [] }, 'Subscriptions coming soon');
    } catch (error) {
        next(error);
    }
};

const createOrder = async (req, res, next) => {
    try {
        const { items, address, paymentMode } = req.body;
        const userId = req.user.id;

        const orderId = await customerService.createOrder({
            userId,
            items,
            address,
            paymentMode,
        });

        response.success(res, { orderId }, 'Order created successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getOrders,
    getSubscriptions,
    createOrder,
};
