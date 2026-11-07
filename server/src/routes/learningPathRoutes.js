const express = require('express');
const { getOrGeneratePath, updateStepStatus } = require('../controllers/learningPathController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/learning-paths/:reportId', authenticate, getOrGeneratePath);
router.patch('/learning-paths/:pathId/steps/:stepId', authenticate, updateStepStatus);

module.exports = router;
