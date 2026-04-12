const deliveryService = require('./delivery.service');
const response = require('../../utils/response');

const getOrders = async (req, res, next) => {
    try {
        const deliveryBoyId = req.user.id;
        const orders = await deliveryService.getOrders({ deliveryBoyId });
        response.success(res, orders, 'Orders fetched successfully');
    } catch (error) {
        next(error);
    }
};

const pickOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const deliveryBoyId = req.user.id;
        await deliveryService.pickOrder({ orderId, deliveryBoyId });
        response.success(res, {}, 'Order picked up successfully');
    } catch (error) {
        next(error);
    }
};

const outForDelivery = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const deliveryBoyId = req.user.id;
        await deliveryService.outForDelivery({ orderId, deliveryBoyId });
        response.success(res, {}, 'Order marked as out for delivery');
    } catch (error) {
        next(error);
    }
};

const deliverOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const deliveryBoyId = req.user.id;
        await deliveryService.deliverOrder({ orderId, deliveryBoyId });
        response.success(res, {}, 'Order delivered successfully');
    } catch (error) {
        next(error);
    }
};

const failOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const deliveryBoyId = req.user.id;
        const reason = req.body.reason;
        await deliveryService.failOrder({ orderId, deliveryBoyId, reason });
        response.success(res, {}, 'Order marked as failed');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    pickOrder,
    outForDelivery,
    deliverOrder,
    failOrder,
};
