const mongoose = require('mongoose');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const User = require('../../models/user.model');
const { ORDER_STATES, ROLES } = require('../../config/constants');
const { validateTransition } = require('../orders/order.transitions');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { auditLog } = require('../../utils/audit');
const { emitEvent } = require('../../utils/eventBus');

const getDeliveryBoys = async () => {
    return await User.find({ role: ROLES.DELIVERY, status: 'ACTIVE' }).select('phone role status _id');
};


const getDashboardStats = async () => {
    // Fetch dashboard statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: ORDER_STATES.PENDING_MANAGER });
    const activeOrders = await Order.countDocuments({
        status: {
            $in: [
                ORDER_STATES.ACCEPTED,
                ORDER_STATES.RESERVED,
                ORDER_STATES.ASSIGNING,
                ORDER_STATES.ASSIGNED,
                ORDER_STATES.PICKED_UP,
                ORDER_STATES.OUT_FOR_DELIVERY,
            ],
        },
    });
    const codPending = await Order.countDocuments({ status: ORDER_STATES.COD_PENDING });
    const lowStockProducts = await Product.countDocuments({ availableStock: { $lt: 10 } });

    return {
        totalOrders,
        pendingOrders,
        activeOrders,
        codPending,
        lowStockProducts,
    };
};

const getProducts = async (filters = {}) => {
    const productService = require('../products/product.service');
    return await productService.getAllProducts(filters);
};

const createProduct = async (productData, managerId, requestId) => {
    const productService = require('../products/product.service');
    const product = await productService.createProduct(productData);

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: product._id,
        source: 'API',
        requestId,
        meta: { name: product.name, price: product.price },
    });

    emitEvent('PRODUCT_CREATED', {
        productId: product._id,
        name: product.name,
        managerId,
    });

    return product;
};

const updateProduct = async (productId, updates, managerId, requestId) => {
    const productService = require('../products/product.service');
    const product = await productService.updateProduct(productId, updates);

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'PRODUCT_UPDATED',
        entityType: 'PRODUCT',
        entityId: productId,
        source: 'API',
        requestId,
        meta: { updates },
    });

    return product;
};

const deleteProduct = async (productId, managerId, requestId) => {
    const productService = require('../products/product.service');
    const product = await productService.deleteProduct(productId);

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'PRODUCT_DELETED',
        entityType: 'PRODUCT',
        entityId: productId,
        source: 'API',
        requestId,
        meta: {},
    });

    return product;
};

const getOrders = async ({ status, page = 1, limit = 20 }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
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

const acceptOrder = async ({ orderId, managerId, requestId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const stockChanges = [];

    try {
        // Load order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        // STOCK VALIDATION: Check if stock is sufficient for each item
        for (const item of order.items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                throw new NotFoundError(`Product ${item.productId} not found`);
            }

            if (product.availableStock < item.qty) {
                throw new ValidationError(
                    `Insufficient stock for product ${item.productId}. Available: ${product.availableStock}, Required: ${item.qty}`
                );
            }
        }

        // Validate and transition: PENDING_MANAGER → ACCEPTED
        validateTransition(order.status, ORDER_STATES.ACCEPTED, ROLES.MANAGER);

        order.timeline.push({
            state: ORDER_STATES.ACCEPTED,
            at: new Date(),
            by: managerId,
        });
        order.status = ORDER_STATES.ACCEPTED;

        // Validate and transition: ACCEPTED → RESERVED
        validateTransition(order.status, ORDER_STATES.RESERVED, ROLES.MANAGER);

        order.timeline.push({
            state: ORDER_STATES.RESERVED,
            at: new Date(),
            by: managerId,
        });
        order.status = ORDER_STATES.RESERVED;

        // STOCK RESERVATION: Move stock from available to reserved
        for (const item of order.items) {
            const product = await Product.findById(item.productId).session(session);

            const availableBefore = product.availableStock;
            const reservedBefore = product.reservedStock;

            product.availableStock -= item.qty;
            product.reservedStock += item.qty;

            const availableAfter = product.availableStock;
            const reservedAfter = product.reservedStock;

            await product.save({ session });

            stockChanges.push({
                productId: item.productId,
                qty: item.qty,
                availableBefore,
                availableAfter,
                reservedBefore,
                reservedAfter,
            });
        }

        // Save order
        await order.save({ session });

        await session.commitTransaction();

        const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

        auditLog({
            actorId: managerId,
            actorRole: 'MANAGER',
            action: 'ORDER_ACCEPTED',
            entityType: 'ORDER',
            entityId: orderId,
            source: 'API',
            requestId,
            meta: {
                itemCount: order.items.length,
                totalQty,
            },
        });

        for (const change of stockChanges) {
            auditLog({
                actorId: managerId,
                actorRole: 'MANAGER',
                action: 'STOCK_RESERVED',
                entityType: 'PRODUCT',
                entityId: change.productId,
                source: 'API',
                requestId,
                meta: {
                    productId: change.productId.toString(),
                    qty: change.qty,
                    availableBefore: change.availableBefore,
                    availableAfter: change.availableAfter,
                    reservedBefore: change.reservedBefore,
                    reservedAfter: change.reservedAfter,
                },
            });
        }

        emitEvent('ORDER_ACCEPTED', {
            orderId,
            customerId: order.customerId,
            managerId,
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const rejectOrder = async ({ orderId, managerId, reason, requestId }) => {
    // Load order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Validate and transition: PENDING_MANAGER → REJECTED_BY_MANAGER
    validateTransition(order.status, ORDER_STATES.REJECTED_BY_MANAGER, ROLES.MANAGER);

    order.timeline.push({
        state: ORDER_STATES.REJECTED_BY_MANAGER,
        at: new Date(),
        by: managerId,
    });
    order.status = ORDER_STATES.REJECTED_BY_MANAGER;

    // Save order
    await order.save();

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'ORDER_REJECTED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {
            reason: reason || 'No reason provided',
        },
    });

    emitEvent('ORDER_REJECTED', {
        orderId,
        customerId: order.customerId,
        managerId,
        reason,
    });
};

const assignOrder = async ({ orderId, managerId, deliveryBoyId, requestId }) => {
    // Load order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Validate and transition: RESERVED → ASSIGNING
    validateTransition(order.status, ORDER_STATES.ASSIGNING, ROLES.MANAGER);

    order.timeline.push({
        state: ORDER_STATES.ASSIGNING,
        at: new Date(),
        by: managerId,
    });
    order.status = ORDER_STATES.ASSIGNING;

    // Validate and transition: ASSIGNING → ASSIGNED
    validateTransition(order.status, ORDER_STATES.ASSIGNED, ROLES.MANAGER);

    order.deliveryBoyId = deliveryBoyId;
    order.timeline.push({
        state: ORDER_STATES.ASSIGNED,
        at: new Date(),
        by: managerId,
    });
    order.status = ORDER_STATES.ASSIGNED;

    // Save order
    await order.save();

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'ORDER_ASSIGNED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {
            deliveryBoyId,
        },
    });

    emitEvent('ORDER_ASSIGNED', {
        orderId,
        customerId: order.customerId,
        deliveryBoyId,
        managerId,
    });
};

const getPendingCOD = async () => {
    // Fetch orders with status = COD_PENDING
    const orders = await Order.find({
        status: ORDER_STATES.COD_PENDING,
    }).sort({ createdAt: -1 });

    return orders;
};

const settleCOD = async ({ orderId, managerId, requestId }) => {
    // Load order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Validate and transition: COD_PENDING → COD_SETTLED
    validateTransition(order.status, ORDER_STATES.COD_SETTLED, ROLES.MANAGER);

    order.timeline.push({
        state: ORDER_STATES.COD_SETTLED,
        at: new Date(),
        by: managerId,
    });
    order.status = ORDER_STATES.COD_SETTLED;

    // Save order
    await order.save();

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'COD_SETTLED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {
            paymentMode: 'COD',
        },
    });

    emitEvent('COD_SETTLED', {
        orderId,
        customerId: order.customerId,
        deliveryBoyId: order.deliveryBoyId,
        managerId,
    });
};

const closeOrder = async ({ orderId, managerId, requestId }) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // ONLINE: DELIVERED → CLOSED
    if (order.paymentMode === 'ONLINE') {
        if (order.status !== ORDER_STATES.DELIVERED) {
            throw new ValidationError('ONLINE orders can only be closed after delivery');
        }
    }

    // COD: COD_SETTLED → CLOSED
    if (order.paymentMode === 'COD') {
        if (order.status !== ORDER_STATES.COD_SETTLED) {
            throw new ValidationError('COD orders must be settled before closing');
        }
    }

    validateTransition(order.status, ORDER_STATES.CLOSED, ROLES.MANAGER);

    order.timeline.push({
        state: ORDER_STATES.CLOSED,
        at: new Date(),
        by: managerId,
    });

    order.status = ORDER_STATES.CLOSED;
    await order.save();

    auditLog({
        actorId: managerId,
        actorRole: 'MANAGER',
        action: 'ORDER_CLOSED',
        entityType: 'ORDER',
        entityId: orderId,
        source: 'API',
        requestId,
        meta: {
            paymentMode: order.paymentMode,
        },
    });
};

module.exports = {
    getDashboardStats,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    acceptOrder,
    rejectOrder,
    assignOrder,
    getPendingCOD,
    settleCOD,
    closeOrder,
    getDeliveryBoys,
};

