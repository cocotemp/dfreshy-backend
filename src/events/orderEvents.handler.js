const { onEvent } = require('../utils/eventBus');
const { createNotification } = require('../services/notification.service');
const User = require('../models/user.model');
const { ROLES } = require('../config/constants');

const registerOrderEventHandlers = () => {
    // ORDER_PLACED
    onEvent('ORDER_PLACED', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Order Placed',
            message: 'Order placed successfully',
            eventType: 'ORDER_PLACED',
            entityType: 'ORDER',
            entityId: orderId,
        });

        // Fetch manager dynamically
        const manager = await User.findOne({ role: ROLES.MANAGER, status: 'ACTIVE' });
        if (manager) {
            createNotification({
                userId: manager._id,
                role: 'MANAGER',
                title: 'New Order',
                message: 'New order received',
                eventType: 'ORDER_PLACED',
                entityType: 'ORDER',
                entityId: orderId,
            });
        }
    });

    // ORDER_ACCEPTED
    onEvent('ORDER_ACCEPTED', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Order Accepted',
            message: 'Order accepted by store',
            eventType: 'ORDER_ACCEPTED',
            entityType: 'ORDER',
            entityId: orderId,
        });
    });

    // ORDER_REJECTED
    onEvent('ORDER_REJECTED', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Order Rejected',
            message: 'Order rejected',
            eventType: 'ORDER_REJECTED',
            entityType: 'ORDER',
            entityId: orderId,
        });
    });

    // ORDER_ASSIGNED
    onEvent('ORDER_ASSIGNED', async (payload) => {
        const { orderId, customerId, deliveryBoyId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Delivery Partner Assigned',
            message: 'Delivery partner assigned',
            eventType: 'ORDER_ASSIGNED',
            entityType: 'ORDER',
            entityId: orderId,
        });

        createNotification({
            userId: deliveryBoyId,
            role: 'DELIVERY',
            title: 'New Delivery',
            message: 'New delivery assigned',
            eventType: 'ORDER_ASSIGNED',
            entityType: 'ORDER',
            entityId: orderId,
        });
    });

    // ORDER_OUT_FOR_DELIVERY
    onEvent('ORDER_OUT_FOR_DELIVERY', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Out for Delivery',
            message: 'Out for delivery',
            eventType: 'ORDER_OUT_FOR_DELIVERY',
            entityType: 'ORDER',
            entityId: orderId,
        });
    });

    // ORDER_DELIVERED
    onEvent('ORDER_DELIVERED', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Order Delivered',
            message: 'Order delivered',
            eventType: 'ORDER_DELIVERED',
            entityType: 'ORDER',
            entityId: orderId,
        });
    });

    // ORDER_FAILED
    onEvent('ORDER_FAILED', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Delivery Failed',
            message: 'Delivery failed',
            eventType: 'ORDER_FAILED',
            entityType: 'ORDER',
            entityId: orderId,
        });

        // Fetch manager dynamically
        const manager = await User.findOne({ role: ROLES.MANAGER, status: 'ACTIVE' });
        if (manager) {
            createNotification({
                userId: manager._id,
                role: 'MANAGER',
                title: 'Delivery Failed',
                message: 'Delivery failed – action needed',
                eventType: 'ORDER_FAILED',
                entityType: 'ORDER',
                entityId: orderId,
            });
        }
    });

    // COD_PENDING
    onEvent('COD_PENDING', async (payload) => {
        const { orderId, customerId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Payment Pending',
            message: 'Please pay cash on delivery',
            eventType: 'COD_PENDING',
            entityType: 'ORDER',
            entityId: orderId,
        });

        // Fetch manager dynamically
        const manager = await User.findOne({ role: ROLES.MANAGER, status: 'ACTIVE' });
        if (manager) {
            createNotification({
                userId: manager._id,
                role: 'MANAGER',
                title: 'COD Pending',
                message: 'COD pending settlement',
                eventType: 'COD_PENDING',
                entityType: 'ORDER',
                entityId: orderId,
            });
        }
    });

    // COD_SETTLED
    onEvent('COD_SETTLED', async (payload) => {
        const { orderId, customerId, deliveryBoyId } = payload;

        createNotification({
            userId: customerId,
            role: 'CUSTOMER',
            title: 'Payment Completed',
            message: 'Payment completed',
            eventType: 'COD_SETTLED',
            entityType: 'ORDER',
            entityId: orderId,
        });

        if (deliveryBoyId) {
            createNotification({
                userId: deliveryBoyId,
                role: 'DELIVERY',
                title: 'Order Closed',
                message: 'Order closed',
                eventType: 'COD_SETTLED',
                entityType: 'ORDER',
                entityId: orderId,
            });
        }
    });
};

module.exports = {
    registerOrderEventHandlers,
};
