const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole([ROLES.ADMIN]));

router.get('/users', adminController.manageUsers);
router.post('/users/assign-role', adminController.assignRole);
router.patch('/users/:userId/toggle-status', adminController.toggleUserStatus);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
