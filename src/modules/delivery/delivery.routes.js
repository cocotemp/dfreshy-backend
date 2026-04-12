const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');
const { standardActionLimiter } = require('../../utils/rateLimiters');

// All routes require authentication and DELIVERY role
router.use(authenticate);
router.use(requireRole([ROLES.DELIVERY]));
router.use(standardActionLimiter);

router.get('/orders', deliveryController.getOrders);
router.post('/orders/:id/pick', deliveryController.pickOrder);
router.post('/orders/:id/out', deliveryController.outForDelivery);
router.post('/orders/:id/deliver', deliveryController.deliverOrder);
router.post('/orders/:id/fail', deliveryController.failOrder);

module.exports = router;
