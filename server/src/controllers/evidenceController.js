const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Evidence = require('../models/Evidence');
const EvidenceChunk = require('../models/EvidenceChunk');
const Skill = require('../models/Skill');
const JobCircular = require('../models/JobCircular');
const JobRequirement = require('../models/JobRequirement');
const SkillGapReport = require('../models/SkillGapReport');
const StudentSkill = require('../models/StudentSkill');
const { extractTextFromFile, chunkText, runGapAnalysis } = require('../services/aiService');
const { embedText, findBestChunks } = require('../services/ragService');
const { resolveOrCreateSkill } = require('../services/skillCatalogService');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

/**
 * Recomputes existing skill-gap reports for a student when their evidence changes
 * Preserves student flags and flag reasons!
 */
async function recomputeReportsForStudent(profileId) {
  try {
    if (!isMongoReady()) {
      const db = readDb();
      const studentReports = (db.reports || []).filter((r) => r.studentProfileId === profileId);
      if (studentReports.length === 0) return;

      const studentSkills = (db.studentSkills || []).filter((ss) => ss.studentProfileId === profileId);
      const studentEvidences = (db.evidences || []).filter((e) => e.studentProfileId === profileId && e.status === 'processed');
      const studentChunks = (db.evidenceChunks || []).filter((c) => c.studentProfileId === profileId);

      for (const report of studentReports) {
        const reqs = (db.jobRequirements || []).filter(
          (r) => r.circularId === report.circularId && r.confirmed === true
        );
        if (reqs.length === 0) continue;

        const analysis = runGapAnalysis({
          requirements: reqs,
          studentSkills,
          studentEvidences,
          evidenceChunks: studentChunks
        });

        // Preserve flagged state
        const updatedItems = analysis.items.map((newItem) => {
          const oldItem = (report.items || []).find((it) => it.skillId === newItem.skillId || it.skillName === newItem.skillName);
          if (oldItem && oldItem.isFlagged) {
            return {
              ...newItem,
              id: oldItem.id || oldItem._id || generateId(),
              isFlagged: true,
              flagReason: oldItem.flagReason || ''
            };
          }
          return {
            ...newItem,
            id: generateId()
          };
        });

        report.matchScore = analysis.matchScore;
        report.totalRequired = analysis.totalRequired;
        report.matchedCount = analysis.matchedCount;
        report.partialCount = analysis.partialCount;
        report.missingCount = analysis.missingCount;
        report.gapCount = analysis.gapCount;
        report.items = updatedItems;
        report.updatedAt = new Date().toISOString();
      }

      writeDb(db);
      return;
    }

    // Mongoose mode
    const reports = await SkillGapReport.find({ studentProfileId: profileId });
    if (reports.length === 0) return;

    const studentSkills = await StudentSkill.find({ studentProfileId: profileId });
    const studentEvidences = await Evidence.find({ studentProfileId: profileId, status: 'processed' });
    const studentChunks = await EvidenceChunk.find({ studentProfileId: profileId });

    for (const report of reports) {
      const reqs = await JobRequirement.find({ circularId: report.circularId, confirmed: true });
      if (reqs.length === 0) continue;

      const analysis = runGapAnalysis({
        requirements: reqs,
        studentSkills,
        studentEvidences,
        evidenceChunks: studentChunks
      });

      const updatedItems = analysis.items.map((newItem) => {
        const oldItem = report.items.find(
          (it) => it.skillId?.toString() === newItem.skillId?.toString() || it.skillName === newItem.skillName
        );
        return {
          ...newItem,
          isFlagged: oldItem ? oldItem.isFlagged : false,
          flagReason: oldItem ? oldItem.flagReason : ''
        };
      });

      report.matchScore = analysis.matchScore;
      report.totalRequired = analysis.totalRequired;
      report.matchedCount = analysis.matchedCount;
      report.partialCount = analysis.partialCount;
      report.missingCount = analysis.missingCount;
      report.gapCount = analysis.gapCount;
      report.items = updatedItems;
      await report.save();
    }
  } catch (err) {
    console.error('Failed to recompute reports for student:', err);
  }
}

exports.recomputeReportsForStudent = recomputeReportsForStudent;

/**
 * FR-04 - FR-07: Real File Upload & Genuine Text Extraction
 */
exports.uploadEvidence = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { skillId, skillName, skillCategory, title, description, evidenceType = 'report' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Evidence file is required.' }
      });
    }

    const resolvedSkill = await resolveOrCreateSkill({
      skillId,
      skillName,
      category: skillCategory
    });

    if (!resolvedSkill) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELD', message: 'Target skill must be selected or entered.' }
      });
    }

    const targetSkillId = resolvedSkill.id;
    const targetSkillName = resolvedSkill.name;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Please provide a personal description of your contribution (at least 10 characters).'
        }
      });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filePath = file.path;

    // Execute genuine text extraction
    const extractionResult = await extractTextFromFile(filePath, file.mimetype, ext);
    const extractedText = extractionResult.text || '';
    const status = extractionResult.status;
    const statusMessage = extractionResult.message;

    // Generate real text chunks from genuine extracted content
    const rawChunks = status === 'processed' ? chunkText(extractedText, 500, 50) : [];
    const chunkCount = rawChunks.length;

    // Compute semantic embeddings for RAG retrieval phase (safe fallback if embedding fails)
    let chunkEmbeddings = [];
    if (rawChunks.length > 0) {
      try {
        chunkEmbeddings = await Promise.all(
          rawChunks.map(async (c) => {
            try {
              return await embedText(c.text);
            } catch (err) {
              console.warn(`[RAG] Failed to embed chunk ${c.index}:`, err.message);
              return [];
            }
          })
        );
      } catch (err) {
        console.error('[RAG] Error embedding chunks:', err.message);
        chunkEmbeddings = rawChunks.map(() => []);
      }
    }

    if (!isMongoReady()) {
      const db = readDb();
      const id = generateId();

      const evidenceItem = {
        id,
        _id: id,
        studentProfileId: profileId,
        skillId: targetSkillId,
        skillName: targetSkillName,
        title: title ? title.trim() : file.originalname,
        description: description.trim(),
        evidenceType,
        originalName: file.originalname,
        storedName: file.filename || file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        extension: ext,
        status,
        statusMessage,
        extractedText,
        chunkCount,
        processedAt: status === 'processed' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString()
      };

      // Store actual extracted chunks with embeddings
      const chunkItems = rawChunks.map((c, idx) => ({
        id: generateId(),
        _id: generateId(),
        evidenceId: id,
        studentProfileId: profileId,
        index: c.index,
        text: c.text,
        embedding: chunkEmbeddings[idx] || [],
        createdAt: new Date().toISOString()
      }));

      db.evidences.push(evidenceItem);
      if (!db.evidenceChunks) db.evidenceChunks = [];
      db.evidenceChunks.push(...chunkItems);
      writeDb(db);

      // Recompute existing reports with new evidence
      if (status === 'processed') {
        await recomputeReportsForStudent(profileId);
      }

      return res.status(201).json({
        success: true,
        data: evidenceItem
      });
    }

    // Mongoose persistence
    const evidence = await Evidence.create({
      studentProfileId: profileId,
      skillId: targetSkillId,
      title: title ? title.trim() : file.originalname,
      description: description.trim(),
      evidenceType,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      extension: ext,
      status,
      statusMessage,
      extractedText,
      chunkCount,
      processedAt: status === 'processed' ? new Date() : null
    });

    // Store chunks in EvidenceChunk collection with embeddings
    if (rawChunks.length > 0) {
      const chunkDocs = rawChunks.map((c, idx) => ({
        evidenceId: evidence._id,
        studentProfileId: profileId,
        index: c.index,
        text: c.text,
        embedding: chunkEmbeddings[idx] || []
      }));
      await EvidenceChunk.insertMany(chunkDocs);
    }

    // Recompute existing reports with new evidence
    if (status === 'processed') {
      await recomputeReportsForStudent(profileId);
    }

    res.status(201).json({
      success: true,
      data: evidence
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all evidence items for the authenticated user
 */
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

/**
 * Get single evidence details with full extracted text and chunks for viewing
 */
exports.getEvidenceById = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const evidence = (db.evidences || []).find(
        (e) => (e.id === id || e._id === id) && e.studentProfileId === profileId
      );
      if (!evidence) {
        return res.status(404).json({ success: false, error: { message: 'Evidence not found' } });
      }

      const chunks = (db.evidenceChunks || []).filter(
        (c) => (c.evidenceId === id || c.evidenceId === evidence.id || c.evidenceId === evidence._id)
      );

      const skill = db.skills.find((s) => s.id === evidence.skillId || s._id === evidence.skillId);

      return res.status(200).json({
        success: true,
        data: {
          ...evidence,
          skill: skill || { name: evidence.skillName || 'General', category: 'Technical' },
          chunks
        }
      });
    }

    const evidence = await Evidence.findOne({ _id: id, studentProfileId: profileId })
      .select('+extractedText')
      .populate('skillId');

    if (!evidence) {
      return res.status(404).json({ success: false, error: { message: 'Evidence not found' } });
    }

    const chunks = await EvidenceChunk.find({ evidenceId: id }).sort({ index: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...evidence.toObject(),
        chunks
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete evidence artifact, its extracted chunks, and disk file
 * Recomputes student gap reports upon deletion!
 */
exports.deleteEvidence = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const evidence = (db.evidences || []).find(
        (e) => (e.id === id || e._id === id) && e.studentProfileId === profileId
      );

      if (!evidence) {
        return res.status(404).json({ success: false, error: { message: 'Evidence not found or unauthorized' } });
      }

      // Remove stored file if exists
      if (evidence.storedName) {
        const filePath = path.join(__dirname, '../../uploads', evidence.storedName);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore unlink error */ }
        }
      }

      // Remove chunks
      db.evidenceChunks = (db.evidenceChunks || []).filter(
        (c) => c.evidenceId !== id && c.evidenceId !== evidence.id && c.evidenceId !== evidence._id
      );

      // Remove evidence record
      db.evidences = db.evidences.filter(
        (e) => !(e.id === id || e._id === id)
      );
      writeDb(db);

      // Recompute reports
      await recomputeReportsForStudent(profileId);

      return res.status(200).json({ success: true, message: 'Evidence deleted and reports updated' });
    }

    const evidence = await Evidence.findOneAndDelete({ _id: id, studentProfileId: profileId });
    if (!evidence) {
      return res.status(404).json({ success: false, error: { message: 'Evidence not found or unauthorized' } });
    }

    // Remove stored file if exists
    if (evidence.storedName) {
      const filePath = path.join(__dirname, '../../uploads', evidence.storedName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore unlink error */ }
      }
    }

    // Remove associated chunks
    await EvidenceChunk.deleteMany({ evidenceId: id });

    // Recompute reports
    await recomputeReportsForStudent(profileId);

    res.status(200).json({ success: true, message: 'Evidence deleted and reports updated' });
  } catch (err) {
    next(err);
  }
};

/**
 * RAG Retrieval Phase: Semantic Search over authenticated student's evidence chunks
 */
exports.semanticSearch = async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query parameter "q" is required.'
        }
      });
    }

    const data = await findBestChunks(req.user.profileId, q.trim(), 3);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};
