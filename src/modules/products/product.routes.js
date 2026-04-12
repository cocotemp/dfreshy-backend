const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// CUSTOMER / PUBLIC: View active products
router.get('/public', productController.getActiveProducts);

// MANAGER routes - full CRUD
router.post(
    '/',
    authenticate,
    requireRole([ROLES.MANAGER]),
    productController.createProduct
);

router.get(
    '/',
    authenticate,
    requireRole([ROLES.MANAGER]),
    productController.getProducts
);

router.put(
    '/:id',
    authenticate,
    requireRole([ROLES.MANAGER]),
    productController.updateProduct
);

router.delete(
    '/:id',
    authenticate,
    requireRole([ROLES.MANAGER]),
    productController.deleteProduct
);

module.exports = router;
