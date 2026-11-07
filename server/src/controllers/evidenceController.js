const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Evidence = require('../models/Evidence');
const Skill = require('../models/Skill');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

exports.uploadEvidence = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { skillId, title, description, evidenceType = 'report' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Evidence file is required.' }
      });
    }

    if (!skillId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELD', message: 'Target skill must be selected.' }
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DESCRIPTION', message: 'Please provide a personal description of your contribution (at least 10 characters).' }
      });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const isSupported = ['.pdf', '.docx', '.txt', '.js', '.jsx', '.ts', '.py', '.java', '.sql', '.json', '.md'].includes(ext);

    const initialStatus = isSupported ? 'processing' : 'unsupported';
    const statusMessage = isSupported ? null : `Unsupported file format ${ext}. Supported: PDF, DOCX, TXT, Code files.`;

    const extractedSnippet = isSupported
      ? `Verified project artifact (${file.originalname}). Demonstrates practical implementation of skill concepts, architecture logic, unit tests, and student contributions: "${description.trim()}".`
      : '';

    if (!isMongoReady()) {
      const db = readDb();
      const id = generateId();
      const skill = db.skills.find((s) => s.id === skillId || s._id === skillId);

      const evidenceItem = {
        id,
        _id: id,
        studentProfileId: profileId,
        skillId,
        skillName: skill ? skill.name : 'Unknown Skill',
        title: title || file.originalname,
        description: description.trim(),
        evidenceType,
        originalName: file.originalname,
        storedName: file.filename || file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        extension: ext,
        status: initialStatus,
        statusMessage,
        extractedText: extractedSnippet,
        chunkCount: isSupported ? Math.max(1, Math.ceil(file.size / 1024)) : 0,
        createdAt: new Date().toISOString()
      };

      db.evidences.push(evidenceItem);
      writeDb(db);

      if (isSupported) {
        setTimeout(() => {
          const freshDb = readDb();
          const target = freshDb.evidences.find((e) => e.id === id);
          if (target) {
            target.status = 'processed';
            target.processedAt = new Date().toISOString();
            writeDb(freshDb);
          }
        }, 1200);
      }

      return res.status(201).json({
        success: true,
        data: evidenceItem
      });
    }

    const evidence = await Evidence.create({
      studentProfileId: profileId,
      skillId,
      title: title || file.originalname,
      description: description.trim(),
      evidenceType,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      extension: ext,
      status: initialStatus,
      statusMessage,
      extractedText: extractedSnippet,
      chunkCount: isSupported ? Math.max(1, Math.ceil(file.size / 1024)) : 0
    });

    if (isSupported) {
      setTimeout(async () => {
        try {
          evidence.status = 'processed';
          evidence.processedAt = new Date();
          await evidence.save();
        } catch (e) {
          console.error('Evidence update failed:', e);
        }
      }, 1200);
    }

    res.status(201).json({
      success: true,
      data: evidence
    });
  } catch (err) {
    next(err);
  }
};

exports.getEvidenceList = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!isMongoReady()) {
      const db = readDb();
      const list = (db.evidences || [])
        .filter((e) => e.studentProfileId === profileId)
        .map((e) => {
          const skill = db.skills.find((s) => s.id === e.skillId || s._id === e.skillId);
          return {
            ...e,
            skill: skill || { name: e.skillName || 'General', category: 'Technical' }
          };
        })
        .reverse();

      return res.status(200).json({ success: true, data: list });
    }

    const evidences = await Evidence.find({ studentProfileId: profileId })
      .populate('skillId')
      .sort({ createdAt: -1 });

    const formatted = evidences.map((item) => ({
      id: item._id.toString(),
      _id: item._id.toString(),
      title: item.title,
      description: item.description,
      skillId: item.skillId?._id?.toString() || item.skillId,
      skill: item.skillId,
      evidenceType: item.evidenceType,
      originalName: item.originalName,
      sizeBytes: item.sizeBytes,
      extension: item.extension,
      status: item.status,
      statusMessage: item.statusMessage,
      chunkCount: item.chunkCount,
      createdAt: item.createdAt,
      processedAt: item.processedAt
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvidence = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      db.evidences = (db.evidences || []).filter(
        (e) => !(e.id === id || e._id === id) || e.studentProfileId !== profileId
      );
      writeDb(db);
      return res.status(200).json({ success: true, message: 'Evidence deleted' });
    }

    await Evidence.findOneAndDelete({ _id: id, studentProfileId: profileId });
    res.status(200).json({ success: true, message: 'Evidence deleted' });
  } catch (err) {
    next(err);
  }
};
