const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const User = require('../../models/user.model');
const { ORDER_STATES } = require('../../config/constants');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { auditLog } = require('../../utils/audit');
const { emitEvent } = require('../../utils/eventBus');

const getProfileById = async (customerId) => {
    const user = await User.findById(customerId).select('-__v');
    if (!user) throw new NotFoundError('User not found');
    return user;
};


const updateProfile = async (customerId, updates) => {
    // Only allow safe fields to be updated
    const allowedUpdates = {};
    if (updates.name) allowedUpdates.name = updates.name;
    const user = await User.findByIdAndUpdate(customerId, allowedUpdates, { new: true }).select('-__v');
    if (!user) throw new NotFoundError('User not found');
    return user;
};


const getOrders = async (customerId, filters = {}) => {
    const { page = 1, limit = 20, status } = filters;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { customerId };
    if (status) {
        filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum);

    return {
        data: orders,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            hasNext: pageNum * limitNum < total,
        },
    };
};

const getSubscriptions = async (customerId) => {
    // Subscriptions are a future feature
    return [];
};


const createOrder = async ({ userId, items, address, paymentMode, requestId }) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Cart cannot be empty');
    }

    if (!address || typeof address !== 'object') {
        throw new ValidationError('Delivery address is required');
    }

    const orderItems = [];

    for (const raw of items) {
        const qty = Number(raw.qty);
        if (!qty || qty <= 0) {
            throw new ValidationError('Invalid quantity');
        }

        const product = await Product.findById(raw.productId);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        if (!product.isActive) {
            throw new ValidationError(`Product "${product.name}" is not available`);
        }

        orderItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            qty,
        });
    }

    if (!['COD', 'ONLINE'].includes(paymentMode)) {
        throw new ValidationError('Invalid payment mode');
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = new Order({
        customerId: userId,
        items: orderItems,
        addressSnapshot: address,
        paymentMode,
        totalAmount,
        status: ORDER_STATES.PENDING_MANAGER,
        timeline: [
            { state: ORDER_STATES.PLACED, at: new Date(), by: userId },
            { state: ORDER_STATES.PENDING_MANAGER, at: new Date(), by: userId },
        ],
    });

    await order.save();

    auditLog({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: order._id,
        source: 'API',
        requestId,
        meta: {
            paymentMode,
            itemCount: orderItems.length,
            totalQty: orderItems.reduce((sum, item) => sum + item.qty, 0),
        },
    });

    emitEvent('ORDER_PLACED', {
        orderId: order._id,
        customerId: userId,
        paymentMode,
    });

    return order._id;
};

module.exports = {
    getProfileById,
    updateProfile,
    getOrders,
    getSubscriptions,
    createOrder,
};
