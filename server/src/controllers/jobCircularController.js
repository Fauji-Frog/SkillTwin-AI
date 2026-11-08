const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const JobCircular = require('../models/JobCircular');
const JobRequirement = require('../models/JobRequirement');
const SkillGapReport = require('../models/SkillGapReport');
const Skill = require('../models/Skill');
const StudentSkill = require('../models/StudentSkill');
const Evidence = require('../models/Evidence');
const EvidenceChunk = require('../models/EvidenceChunk');
const { extractTextFromFile, extractSkillsFromText, runGapAnalysis } = require('../services/aiService');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

/**
 * FR-08: Submit Job Circular (via text paste OR PDF/DOCX file upload)
 * Extracts skills using word-boundary matching and creates UNCONFIRMED requirements (FR-09)
 */
exports.submitCircular = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { title, company = 'Target Organization' } = req.body;
    let rawText = req.body.rawText ? req.body.rawText.trim() : '';
    const file = req.file;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TITLE', message: 'Job title is required.' }
      });
    }

    // If file uploaded, extract actual text from PDF/DOCX
    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      const extracted = await extractTextFromFile(file.path, file.mimetype, ext);
      if (extracted.status === 'failed' || extracted.status === 'unsupported') {
        return res.status(400).json({
          success: false,
          error: { code: 'EXTRACTION_FAILED', message: extracted.message || 'Failed to extract text from circular file.' }
        });
      }
      rawText = extracted.text;
    }

    if (!rawText || rawText.length < 15) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TEXT',
          message: 'Job circular text is required (paste description or upload PDF/DOCX document with at least 15 characters).'
        }
      });
    }

    if (!isMongoReady()) {
      const db = readDb();
      const circularId = generateId();

      const circular = {
        id: circularId,
        _id: circularId,
        studentProfileId: profileId,
        title: title.trim(),
        company: company.trim() || 'Target Organization',
        rawText,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const detected = extractSkillsFromText(rawText, db.skills || []);

      // Never automatically set confirmed: true without explicit user confirmation!
      const requirements = detected.map((s) => ({
        id: generateId(),
        _id: generateId(),
        circularId,
        skillId: s.skillId,
        skillName: s.skillName,
        category: s.category || 'Technical',
        importance: 'required',
        confirmed: false, // Unconfirmed per FR-09
        createdAt: new Date().toISOString()
      }));

      db.jobCirculars.push(circular);
      if (!db.jobRequirements) db.jobRequirements = [];
      db.jobRequirements.push(...requirements);
      writeDb(db);

      return res.status(201).json({
        success: true,
        data: {
          circular,
          requirements,
          warning: requirements.length === 0 ? 'NO_SKILLS_FOUND' : null
        }
      });
    }

    // Mongoose persistence
    const catalog = await Skill.find({ isActive: true });
    const detected = extractSkillsFromText(rawText, catalog);

    const circular = await JobCircular.create({
      studentProfileId: profileId,
      title: title.trim(),
      company: company.trim() || 'Target Organization',
      rawText,
      status: 'pending'
    });

    const reqDocs = detected.map((s) => ({
      circularId: circular._id,
      skillId: s.skillId,
      skillName: s.skillName,
      importance: 'required',
      confirmed: false // Explicitly unconfirmed until student reviews
    }));

    let requirements = [];
    if (reqDocs.length > 0) {
      requirements = await JobRequirement.insertMany(reqDocs);
    }

    res.status(201).json({
      success: true,
      data: {
        circular,
        requirements,
        warning: requirements.length === 0 ? 'NO_SKILLS_FOUND' : null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all job circulars for authenticated user
 */
exports.getCirculars = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!isMongoReady()) {
      const db = readDb();
      const list = (db.jobCirculars || [])
        .filter((c) => c.studentProfileId === profileId)
        .map((c) => {
          const reqs = (db.jobRequirements || []).filter((r) => r.circularId === (c.id || c._id));
          return {
            ...c,
            totalSkills: reqs.length,
            confirmedSkills: reqs.filter((r) => r.confirmed === true).length
          };
        })
        .reverse();
      return res.status(200).json({ success: true, data: list });
    }

    const circulars = await JobCircular.find({ studentProfileId: profileId }).sort({ createdAt: -1 });
    const formatted = await Promise.all(
      circulars.map(async (c) => {
        const reqs = await JobRequirement.find({ circularId: c._id });
        return {
          id: c._id.toString(),
          _id: c._id.toString(),
          title: c.title,
          company: c.company,
          rawText: c.rawText,
          status: c.status,
          totalSkills: reqs.length,
          confirmedSkills: reqs.filter((r) => r.confirmed === true).length,
          createdAt: c.createdAt
        };
      })
    );

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

/**
 * Get circular details and its extracted requirements for review
 */
exports.getCircularById = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const circular = (db.jobCirculars || []).find(
        (c) => (c.id === id || c._id === id) && c.studentProfileId === profileId
      );
      if (!circular) {
        return res.status(404).json({ success: false, error: { message: 'Job circular not found' } });
      }

      const requirements = (db.jobRequirements || []).filter(
        (r) => r.circularId === (circular.id || circular._id)
      );

      return res.status(200).json({
        success: true,
        data: {
          circular,
          requirements
        }
      });
    }

    const circular = await JobCircular.findOne({ _id: id, studentProfileId: profileId });
    if (!circular) {
      return res.status(404).json({ success: false, error: { message: 'Job circular not found' } });
    }

    const requirements = await JobRequirement.find({ circularId: id });

    res.status(200).json({
      success: true,
      data: {
        circular,
        requirements
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FR-09: User Review & Confirmation of Extracted Skills
 * Persists confirmed requirements in JobRequirement collection
 */
exports.confirmRequirements = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;
    const { confirmedSkillIds = [] } = req.body;

    const confirmedSet = new Set(confirmedSkillIds.map((sid) => sid.toString()));

    if (!isMongoReady()) {
      const db = readDb();
      const circular = (db.jobCirculars || []).find(
        (c) => (c.id === id || c._id === id) && c.studentProfileId === profileId
      );
      if (!circular) {
        return res.status(404).json({ success: false, error: { message: 'Job circular not found' } });
      }

      const reqs = (db.jobRequirements || []).filter(
        (r) => r.circularId === (circular.id || circular._id)
      );

      for (const r of reqs) {
        const rId = (r.id || r._id).toString();
        const sId = (r.skillId || '').toString();
        r.confirmed = confirmedSet.has(rId) || confirmedSet.has(sId);
      }

      writeDb(db);

      return res.status(200).json({
        success: true,
        message: 'Requirements confirmation saved',
        data: reqs
      });
    }

    const circular = await JobCircular.findOne({ _id: id, studentProfileId: profileId });
    if (!circular) {
      return res.status(404).json({ success: false, error: { message: 'Job circular not found' } });
    }

    const reqs = await JobRequirement.find({ circularId: id });
    for (const r of reqs) {
      const rId = r._id.toString();
      const sId = r.skillId.toString();
      r.confirmed = confirmedSet.has(rId) || confirmedSet.has(sId);
      await r.save();
    }

    res.status(200).json({
      success: true,
      message: 'Requirements confirmation saved',
      data: reqs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FR-10 - FR-13: Evidence-Grounded Gap Analysis
 * Searches actual extracted evidence content when matching candidate skills
 */
exports.analyzeSkillGap = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const circular = (db.jobCirculars || []).find(
        (c) => (c.id === id || c._id === id) && c.studentProfileId === profileId
      );
      if (!circular) {
        return res.status(404).json({ success: false, error: { message: 'Job circular not found.' } });
      }

      // Check requirements extracted for circular
      const allReqs = (db.jobRequirements || []).filter(
        (r) => r.circularId === (circular.id || circular._id)
      );

      if (allReqs.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_SKILLS_FOUND',
            message: 'No skills found in circular. Please upload a circular with technical requirements or add skills manually.'
          }
        });
      }

      const confirmedReqs = allReqs.filter((r) => r.confirmed === true);
      if (confirmedReqs.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REQUIREMENTS_UNCONFIRMED',
            message: 'Requirements have not been confirmed yet. Please review and confirm extracted skills before running analysis.'
          }
        });
      }

      const reqs = confirmedReqs;

      const studentSkills = (db.studentSkills || []).filter((ss) => ss.studentProfileId === profileId);
      const studentEvidences = (db.evidences || []).filter(
        (e) => e.studentProfileId === profileId && e.status === 'processed'
      );
      const evidenceChunks = (db.evidenceChunks || []).filter((c) => c.studentProfileId === profileId);

      // Perform genuine evidence-grounded RAG gap analysis
      const analysis = runGapAnalysis({
        requirements: reqs,
        studentSkills,
        studentEvidences,
        evidenceChunks
      });

      const reportId = generateId();
      const report = {
        id: reportId,
        _id: reportId,
        studentProfileId: profileId,
        circularId: circular.id || circular._id,
        jobTitle: circular.title,
        company: circular.company,
        matchScore: analysis.matchScore,
        totalRequired: analysis.totalRequired,
        matchedCount: analysis.matchedCount,
        partialCount: analysis.partialCount,
        missingCount: analysis.missingCount,
        gapCount: analysis.gapCount,
        durationMs: analysis.durationMs || 0,
        items: analysis.items,
        disclaimer: 'This report is an AI-generated guidance tool based on your uploaded evidence. It does not represent an official hiring or accreditation decision.',
        createdAt: new Date().toISOString()
      };

      if (!db.reports) db.reports = [];
      db.reports.push(report);
      circular.status = 'analyzed';
      writeDb(db);

      return res.status(201).json({
        success: true,
        data: report
      });
    }

    // Mongoose execution
    const circular = await JobCircular.findOne({ _id: id, studentProfileId: profileId });
    if (!circular) {
      return res.status(404).json({ success: false, error: { message: 'Job circular not found.' } });
    }

    const allReqs = await JobRequirement.find({ circularId: id }).populate('skillId');
    if (allReqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SKILLS_FOUND',
          message: 'No skills found in circular. Please upload a circular with technical requirements or add skills manually.'
        }
      });
    }

    const confirmedReqs = allReqs.filter((r) => r.confirmed === true);
    if (confirmedReqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REQUIREMENTS_UNCONFIRMED',
          message: 'Requirements have not been confirmed yet. Please review and confirm extracted skills before running analysis.'
        }
      });
    }

    const reqs = confirmedReqs;

    const studentSkills = await StudentSkill.find({ studentProfileId: profileId }).populate('skillId');
    const studentEvidences = await Evidence.find({ studentProfileId: profileId, status: 'processed' });
    const evidenceChunks = await EvidenceChunk.find({ studentProfileId: profileId });

    const analysis = runGapAnalysis({
      requirements: reqs,
      studentSkills,
      studentEvidences,
      evidenceChunks
    });

    const report = await SkillGapReport.create({
      studentProfileId: profileId,
      circularId: circular._id,
      jobTitle: circular.title,
      company: circular.company,
      matchScore: analysis.matchScore,
      totalRequired: analysis.totalRequired,
      matchedCount: analysis.matchedCount,
      partialCount: analysis.partialCount,
      missingCount: analysis.missingCount,
      gapCount: analysis.gapCount,
      durationMs: analysis.durationMs || 0,
      items: analysis.items
    });

    circular.status = 'analyzed';
    await circular.save();

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};
