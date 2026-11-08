const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  submitCircular,
  getCirculars,
  getCircularById,
  confirmRequirements,
  analyzeSkillGap
} = require('../controllers/jobCircularController');
const { authenticate } = require('../middleware/auth');
const env = require('../config/env');

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `circular-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (env.MAX_UPLOAD_MB || 10) * 1024 * 1024 }
});

const router = express.Router();

// FR-08, FR-09: Circular Submission with pasted text or PDF/DOCX file
router.post('/job-circulars', authenticate, upload.single('file'), submitCircular);
router.get('/job-circulars', authenticate, getCirculars);
router.get('/job-circulars/:id', authenticate, getCircularById);

// FR-09: Explicit Review & Confirmation of Extracted Skills
router.post('/job-circulars/:id/confirm-requirements', authenticate, confirmRequirements);

// FR-10 - FR-13: Evidence-Grounded Gap Analysis
router.post('/job-circulars/:id/analyze', authenticate, analyzeSkillGap);

module.exports = router;
