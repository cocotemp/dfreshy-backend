const mongoose = require('mongoose');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const { ORDER_STATES, ROLES } = require('../../config/constants');
const { validateTransition } = require('../orders/order.transitions');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { auditLog } = require('../../utils/audit');
const { emitEvent } = require('../../utils/eventBus');

const getOrders = async ({ deliveryBoyId }) => {
    // Fetch orders where status IN [ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY]
    // AND deliveryBoyId matches
    const orders = await Order.find({
        deliveryBoyId,
        status: {
            $in: [
                ORDER_STATES.ASSIGNED,
                ORDER_STATES.PICKED_UP,
                ORDER_STATES.OUT_FOR_DELIVERY,
            ],
        },
    }).sort({ createdAt: -1 });

    return orders;
};

const pickOrder = async ({ orderId, deliveryBoyId, requestId }) => {
    // Load order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Verify order is assigned to this delivery boy
    if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== deliveryBoyId) {
        throw new ValidationError('Order is not assigned to you');
    }

    // Validate and transition: ASSIGNED → PICKED_UP
    validateTransition(order.status, ORDER_STATES.PICKED_UP, ROLES.DELIVERY);

    order.timeline.push({
        state: ORDER_STATES.PICKED_UP,
        at: new Date(),
        by: deliveryBoyId,
    });
    order.status = ORDER_STATES.PICKED_UP;

    // Save order
    await order.save();

    auditLog({
        actorId: deliveryBoyId,
        actorRole: 'DELIVERY',
        action: 'ORDER_PICKED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {},
    });
};

const outForDelivery = async ({ orderId, deliveryBoyId, requestId }) => {
    // Load order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Verify order is assigned to this delivery boy
    if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== deliveryBoyId) {
        throw new ValidationError('Order is not assigned to you');
    }

    // Validate and transition: PICKED_UP → OUT_FOR_DELIVERY
    validateTransition(order.status, ORDER_STATES.OUT_FOR_DELIVERY, ROLES.DELIVERY);

    order.timeline.push({
        state: ORDER_STATES.OUT_FOR_DELIVERY,
        at: new Date(),
        by: deliveryBoyId,
    });
    order.status = ORDER_STATES.OUT_FOR_DELIVERY;

    // Save order
    await order.save();

    auditLog({
        actorId: deliveryBoyId,
        actorRole: 'DELIVERY',
        action: 'ORDER_OUT',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {},
    });

    emitEvent('ORDER_OUT_FOR_DELIVERY', {
        orderId,
        customerId: order.customerId,
        deliveryBoyId,
    });
};

const deliverOrder = async ({ orderId, deliveryBoyId, requestId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const stockChanges = [];
    let isCOD = false;

    try {
        // Load order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Verify order is assigned to this delivery boy
        if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== deliveryBoyId) {
            throw new ValidationError('Order is not assigned to you');
        }

        // Validate and transition: OUT_FOR_DELIVERY → DELIVERED
        validateTransition(order.status, ORDER_STATES.DELIVERED, ROLES.DELIVERY);

        order.timeline.push({
            state: ORDER_STATES.DELIVERED,
            at: new Date(),
            by: deliveryBoyId,
        });
        order.status = ORDER_STATES.DELIVERED;

        // Set status = COD_PENDING if paymentMode is COD
        if (order.paymentMode === 'COD') {
            isCOD = true;
            validateTransition(order.status, ORDER_STATES.COD_PENDING, ROLES.DELIVERY);

            order.timeline.push({
                state: ORDER_STATES.COD_PENDING,
                at: new Date(),
                by: deliveryBoyId,
            });
            order.status = ORDER_STATES.COD_PENDING;
        }

        // STOCK CONSUMPTION: Remove reserved stock (physical stock leaves system)
        for (const item of order.items) {
            const product = await Product.findById(item.productId).session(session);
            if (product) {
                const reservedBefore = product.reservedStock;
                product.reservedStock -= item.qty;
                const reservedAfter = product.reservedStock;

                await product.save({ session });

                stockChanges.push({
                    productId: item.productId,
                    qty: item.qty,
                    reservedBefore,
                    reservedAfter,
                });
            }
        }

        // Save order
        await order.save({ session });

        await session.commitTransaction();

        auditLog({
            actorId: deliveryBoyId,
            actorRole: 'DELIVERY',
            action: 'ORDER_DELIVERED',
            entityType: 'ORDER',
            entityId: orderId,
            source: 'API',
            requestId,
            meta: {
                paymentMode: order.paymentMode,
            },
        });

        for (const change of stockChanges) {
            auditLog({
                actorId: deliveryBoyId,
                actorRole: 'DELIVERY',
                action: 'STOCK_CONSUMED',
                entityType: 'PRODUCT',
                entityId: change.productId,
                source: 'API',
                requestId,
                meta: {
                    productId: change.productId.toString(),
                    qty: change.qty,
                    reservedBefore: change.reservedBefore,
                    reservedAfter: change.reservedAfter,
                },
            });
        }

        if (isCOD) {
            auditLog({
                actorId: deliveryBoyId,
                actorRole: 'DELIVERY',
                action: 'COD_PENDING',
                entityType: 'ORDER',
                entityId: orderId,
                source: 'API',
                requestId,
                meta: {
                    paymentMode: 'COD',
                },
            });
        }

        emitEvent('ORDER_DELIVERED', {
            orderId,
            customerId: order.customerId,
            deliveryBoyId,
            paymentMode: order.paymentMode,
        });

        if (isCOD) {
            emitEvent('COD_PENDING', {
                orderId,
                customerId: order.customerId,
            });
        }
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const failOrder = async ({ orderId, deliveryBoyId, reason, requestId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const stockChanges = [];

    try {
        // Load order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // Verify order is assigned to this delivery boy
        if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== deliveryBoyId) {
            throw new ValidationError('Order is not assigned to you');
        }

        // Validate and transition: OUT_FOR_DELIVERY → FAILED_DELIVERY
        validateTransition(order.status, ORDER_STATES.FAILED_DELIVERY, ROLES.DELIVERY);

        order.timeline.push({
            state: ORDER_STATES.FAILED_DELIVERY,
            at: new Date(),
            by: deliveryBoyId,
            reason: reason || 'No reason provided',
        });
        order.status = ORDER_STATES.FAILED_DELIVERY;

        // STOCK RESTORATION: Return reserved stock back to available
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

        // Save order
        await order.save({ session });

        await session.commitTransaction();

        auditLog({
            actorId: deliveryBoyId,
            actorRole: 'DELIVERY',
            action: 'ORDER_FAILED',
            entityType: 'ORDER',
            entityId: orderId,
            source: 'API',
            requestId,
            meta: {
                reason: reason || 'No reason provided',
            },
        });

        for (const change of stockChanges) {
            auditLog({
                actorId: deliveryBoyId,
                actorRole: 'DELIVERY',
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

        emitEvent('ORDER_FAILED', {
            orderId,
            customerId: order.customerId,
            reason,
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

module.exports = {
    getOrders,
    pickOrder,
    outForDelivery,
    deliverOrder,
    failOrder,
};
