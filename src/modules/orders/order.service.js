const Order = require('./order.model');
const Product = require('../products/product.model');
const { validateTransition } = require('./order.transitions');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../utils/errors');
const { auditLog } = require('../../utils/audit');
const { emitEvent } = require('../../utils/eventBus');
const { ORDER_STATES } = require('../../config/constants');
const mongoose = require('mongoose');

const createOrder = async (orderData) => {
    // This is primarily handled by customer.service.js
    // Keeping this as a centralized function for future use
    const { customerId, items, address, paymentMode } = orderData;

    if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Cart cannot be empty');
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive) {
            throw new NotFoundError(`Product ${item.productId} not found or inactive`);
        }

        orderItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            qty: item.qty,
        });

        totalAmount += product.price * item.qty;
    }

    const order = new Order({
        customerId,
        items: orderItems,
        addressSnapshot: address,
        paymentMode,
        totalAmount,
        status: ORDER_STATES.PENDING_MANAGER,
        timeline: [
            { state: ORDER_STATES.PLACED, at: new Date(), by: customerId },
            { state: ORDER_STATES.PENDING_MANAGER, at: new Date(), by: customerId },
        ],
    });

    await order.save();
    return order;
};

const getOrderById = async (orderId, userId = null, userRole = null) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Ownership validation
    if (userId && userRole) {
        const isOwner = order.customerId.toString() === userId;
        const isAssignedDelivery = order.deliveryBoyId && order.deliveryBoyId.toString() === userId;
        const isManagerOrAdmin = ['MANAGER', 'ADMIN'].includes(userRole);

        if (!isOwner && !isAssignedDelivery && !isManagerOrAdmin) {
            throw new ForbiddenError('You do not have access to this order');
        }
    }

    return order;
};

const updateOrderStatus = async (orderId, newStatus, userId, userRole, requestId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Validate state transition
    validateTransition(order.status, newStatus, userRole);

    const oldStatus = order.status;

    // Update status and timeline
    order.status = newStatus;
    order.timeline.push({
        state: newStatus,
        at: new Date(),
        by: userId,
    });

    await order.save();

    // Audit log
    auditLog({
        actorId: userId,
        actorRole: userRole,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {
            oldStatus,
            newStatus,
        },
    });

    return order;
};

const getOrders = async (filters = {}) => {
    const {
        customerId,
        deliveryBoyId,
        status,
        paymentMode,
        orderSource,
        page = 1,
        limit = 20,
    } = filters;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};

    if (customerId) query.customerId = customerId;
    if (deliveryBoyId) query.deliveryBoyId = deliveryBoyId;
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    if (orderSource) query.orderSource = orderSource;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
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

const cancelOrder = async (orderId, userId, userRole, requestId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const stockChanges = [];

    try {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Only customer can cancel their own order, or manager can cancel any
        if (userRole === 'CUSTOMER' && order.customerId.toString() !== userId) {
            throw new ForbiddenError('You can only cancel your own orders');
        }

        // Determine target state based on current state and role
        let targetState;
        if (userRole === 'CUSTOMER') {
            targetState = ORDER_STATES.CANCELLED_BY_CUSTOMER;
        } else if (userRole === 'MANAGER') {
            targetState = ORDER_STATES.REJECTED_BY_MANAGER;
        } else {
            throw new ForbiddenError('Only customers and managers can cancel orders');
        }

        // For orders in RESERVED state, we need to restore stock
        if (order.status === ORDER_STATES.RESERVED) {
            for (const item of order.items) {
                const product = await Product.findById(item.productId).session(session);
                if (product) {
                    const reservedBefore = product.reservedStock;
                    const availableBefore = product.availableStock;

                    product.reservedStock -= item.qty;
                    product.availableStock += item.qty;

                    const reservedAfter = product.reservedStock;
                    const availableAfter = product.availableStock;

                    await product.save({ session });

                    stockChanges.push({
                        productId: item.productId,
                        qty: item.qty,
                        reservedBefore,
                        reservedAfter,
                        availableBefore,
                        availableAfter,
                    });
                }
            }
        }

        // Update order status
        order.status = targetState;
        order.timeline.push({
            state: targetState,
            at: new Date(),
            by: userId,
        });

        await order.save({ session });
        await session.commitTransaction();

        // Audit logging
        auditLog({
            actorId: userId,
            actorRole: userRole,
            action: 'ORDER_CANCELLED',
            entityType: 'ORDER',
            entityId: orderId,
            source: 'API',
            requestId,
            meta: {
                previousStatus: order.status,
                newStatus: targetState,
            },
        });

        for (const change of stockChanges) {
            auditLog({
                actorId: userId,
                actorRole: userRole,
                action: 'STOCK_RESTORED',
                entityType: 'PRODUCT',
                entityId: change.productId,
                source: 'API',
                requestId,
                meta: {
                    productId: change.productId.toString(),
                    qty: change.qty,
                    reservedBefore: change.reservedBefore,
                    reservedAfter: change.reservedAfter,
                    availableBefore: change.availableBefore,
                    availableAfter: change.availableAfter,
                },
            });
        }

        emitEvent('ORDER_CANCELLED', {
            orderId,
            customerId: order.customerId,
            cancelledBy: userId,
            reason: 'Cancelled by user',
        });

        return order;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
    getOrders,
    cancelOrder,
};
