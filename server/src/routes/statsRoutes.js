const express = require('express');
const { getDashboardStats } = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/stats', authenticate, getDashboardStats);

module.exports = router;
