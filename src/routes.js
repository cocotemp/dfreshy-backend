const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const managerRoutes = require('./modules/manager/manager.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const router = express.Router();

// Mount module routes
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/manager', managerRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
