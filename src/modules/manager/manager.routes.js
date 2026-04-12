const express = require('express');
const router = express.Router();
const managerController = require('./manager.controller');
const productRoutes = require('../products/product.routes');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');
const { standardActionLimiter } = require('../../utils/rateLimiters');

// All routes require authentication and MANAGER role
router.use(authenticate);
router.use(requireRole([ROLES.MANAGER]));
router.use(standardActionLimiter);

router.get('/dashboard', managerController.getDashboard);
router.get('/products', managerController.manageProducts);
router.get('/orders', managerController.getOrders);
router.post('/orders/:id/accept', managerController.acceptOrder);
router.post('/orders/:id/reject', managerController.rejectOrder);
router.post('/orders/:id/assign', managerController.assignOrder);
router.get('/cod/pending', managerController.getPendingCOD);
router.post('/orders/:id/settle', managerController.settleCOD);
router.post('/orders/:id/close', managerController.closeOrder);
router.get('/delivery-boys', managerController.getDeliveryBoys);

// Product management routes
router.use('/products', productRoutes);

module.exports = router;

