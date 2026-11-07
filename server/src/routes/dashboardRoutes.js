const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.use(authenticate, requireRole('student'));

router.get('/', dashboardController.getDashboardStats);

module.exports = router;
