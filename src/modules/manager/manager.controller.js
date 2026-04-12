const managerService = require('./manager.service');
const response = require('../../utils/response');

const getDashboard = async (req, res, next) => {
    try {
        const stats = await managerService.getDashboardStats();
        response.success(res, { stats }, 'Dashboard data fetched successfully');
    } catch (error) {
        next(error);
    }
};

const manageProducts = async (req, res, next) => {
    try {
        // TODO: Product management operations

        response.success(res, {}, 'Manage products endpoint - not implemented yet');
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const { status } = req.query;

        const orders = await managerService.getOrders({ status });

        response.success(res, { orders }, 'Orders fetched successfully');
    } catch (error) {
        next(error);
    }
};

const acceptOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const managerId = req.user.id;

        await managerService.acceptOrder({ orderId, managerId });

        response.success(res, {}, 'Order accepted successfully');
    } catch (error) {
        next(error);
    }
};

const rejectOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const managerId = req.user.id;
        const { reason } = req.body;

        await managerService.rejectOrder({ orderId, managerId, reason });

        response.success(res, {}, 'Order rejected successfully');
    } catch (error) {
        next(error);
    }
};

const assignOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const managerId = req.user.id;
        const { deliveryBoyId } = req.body;

        await managerService.assignOrder({ orderId, managerId, deliveryBoyId });

        response.success(res, {}, 'Order assigned successfully');
    } catch (error) {
        next(error);
    }
};

const getPendingCOD = async (req, res, next) => {
    try {
        const orders = await managerService.getPendingCOD();

        response.success(res, { orders }, 'Pending COD orders fetched successfully');
    } catch (error) {
        next(error);
    }
};

const settleCOD = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const managerId = req.user.id;

        await managerService.settleCOD({ orderId, managerId });

        response.success(res, {}, 'COD settled successfully');
    } catch (error) {
        next(error);
    }
};

const closeOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const managerId = req.user.id;

        await managerService.closeOrder({ orderId, managerId });

        response.success(res, {}, 'Order closed successfully');
    } catch (error) {
        next(error);
    }
};

const getDeliveryBoys = async (req, res, next) => {
    try {
        const boys = await managerService.getDeliveryBoys();
        response.success(res, { deliveryBoys: boys }, 'Delivery boys fetched successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    manageProducts,
    getOrders,
    acceptOrder,
    rejectOrder,
    assignOrder,
    getPendingCOD,
    settleCOD,
    closeOrder,
    getDeliveryBoys,
};

