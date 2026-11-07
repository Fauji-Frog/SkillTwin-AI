const express = require('express');
const { submitCircular, getCirculars, analyzeSkillGap } = require('../controllers/jobCircularController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/job-circulars', authenticate, submitCircular);
router.get('/job-circulars', authenticate, getCirculars);
router.post('/job-circulars/:id/analyze', authenticate, analyzeSkillGap);

module.exports = router;
