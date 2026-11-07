const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const upload = require('../middleware/upload');

router.use(authenticate, requireRole('student'));

router.post('/', upload.single('file'), jobController.submitJobCircular);
router.get('/', jobController.getJobCirculars);
router.get('/:id', jobController.getJobCircularById);
router.patch('/requirements/:id', jobController.toggleRequirement);
router.post('/:id/requirements', jobController.addRequirementManually);

module.exports = router;
