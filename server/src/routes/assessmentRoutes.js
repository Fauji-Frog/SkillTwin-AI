const express = require('express');
const { getAssessments, getAssessmentById, submitAssessment } = require('../controllers/assessmentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/assessments', authenticate, getAssessments);
router.get('/assessments/:id', authenticate, getAssessmentById);
router.post('/assessments/:id/submit', authenticate, submitAssessment);

module.exports = router;
