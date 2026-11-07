const express = require('express');
const { getReports, getReportById, flagReportItem } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/reports', authenticate, getReports);
router.get('/reports/:id', authenticate, getReportById);
router.post('/reports/:id/items/:itemId/flag', authenticate, flagReportItem);

module.exports = router;
