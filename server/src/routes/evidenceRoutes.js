const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadEvidence, getEvidenceList, deleteEvidence } = require('../controllers/evidenceController');
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
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (env.MAX_UPLOAD_MB || 10) * 1024 * 1024 }
});

const router = express.Router();

router.post('/evidence', authenticate, upload.single('file'), uploadEvidence);
router.get('/evidence', authenticate, getEvidenceList);
router.delete('/evidence/:id', authenticate, deleteEvidence);

module.exports = router;
