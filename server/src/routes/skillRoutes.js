const express = require('express');
const { getAllSkills, getStudentSkills, addStudentSkill, deleteStudentSkill } = require('../controllers/skillController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/skills', getAllSkills);
router.get('/student-skills', authenticate, getStudentSkills);
router.post('/student-skills', authenticate, addStudentSkill);
router.delete('/student-skills/:id', authenticate, deleteStudentSkill);

module.exports = router;
