const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.use(authenticate, requireRole('student'));

router.get('/', skillController.getStudentSkills);
router.post('/', skillController.addStudentSkill);
router.put('/:id', skillController.updateStudentSkill);
router.delete('/:id', skillController.deleteStudentSkill);

module.exports = router;
