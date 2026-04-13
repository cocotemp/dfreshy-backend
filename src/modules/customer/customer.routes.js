const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const productController = require('../products/product.controller');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');
const { orderCreateLimiter } = require('../../utils/rateLimiters');

// All routes require authentication and CUSTOMER role
router.use(authenticate);
router.use(requireRole([ROLES.CUSTOMER]));

router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.get('/products', productController.getActiveProducts);
router.post('/orders', orderCreateLimiter, customerController.createOrder);
router.get('/orders', customerController.getOrders);
router.get('/subscriptions', customerController.getSubscriptions);

module.exports = router;
