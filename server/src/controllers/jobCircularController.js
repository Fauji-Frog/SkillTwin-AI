const mongoose = require('mongoose');
const JobCircular = require('../models/JobCircular');
const JobRequirement = require('../models/JobRequirement');
const SkillGapReport = require('../models/SkillGapReport');
const Skill = require('../models/Skill');
const StudentSkill = require('../models/StudentSkill');
const Evidence = require('../models/Evidence');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

function extractSkillsFromText(text, skillsCatalog) {
  const lowerText = text.toLowerCase();
  const matched = [];

  for (const skill of skillsCatalog) {
    const terms = [skill.name.toLowerCase(), ...(skill.synonyms || []).map((s) => s.toLowerCase())];
    const hit = terms.some((term) => {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerText);
    });

    if (hit) {
      matched.push(skill);
    }
  }

  return matched;
}

exports.submitCircular = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { title, company = 'Target Tech Corp', rawText } = req.body;

    if (!title || !rawText) {
      return res.status(400).json({
        success: false,
        error: { message: 'Job title and circular description text are required.' }
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
        company: company.trim() || 'Target Tech Corp',
        rawText: rawText.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const detected = extractSkillsFromText(rawText, db.skills);
      const requirements = detected.map((s) => ({
        id: generateId(),
        _id: generateId(),
        circularId,
        skillId: s.id || s._id,
        skillName: s.name,
        category: s.category,
        importance: 'required',
        confirmed: true
      }));

      db.jobCirculars.push(circular);
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

    const catalog = await Skill.find({ isActive: true });
    const detected = extractSkillsFromText(rawText, catalog);

    const circular = await JobCircular.create({
      studentProfileId: profileId,
      title: title.trim(),
      company: company.trim() || 'Target Tech Corp',
      rawText: rawText.trim(),
      status: 'pending'
    });

    const reqDocs = detected.map((s) => ({
      circularId: circular._id,
      skillId: s._id,
      skillName: s.name,
      importance: 'required',
      confirmed: true
    }));

    const requirements = await JobRequirement.insertMany(reqDocs);

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

exports.getCirculars = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!isMongoReady()) {
      const db = readDb();
      const list = (db.jobCirculars || []).filter((c) => c.studentProfileId === profileId).reverse();
      return res.status(200).json({ success: true, data: list });
    }

    const list = await JobCircular.find({ studentProfileId: profileId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

exports.analyzeSkillGap = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const circular = db.jobCirculars.find((c) => (c.id === id || c._id === id) && c.studentProfileId === profileId);
      if (!circular) {
        return res.status(404).json({ success: false, error: { message: 'Job circular not found.' } });
      }

      const reqs = (db.jobRequirements || []).filter((r) => r.circularId === (circular.id || circular._id) && r.confirmed !== false);
      const studentSkills = (db.studentSkills || []).filter((ss) => ss.studentProfileId === profileId);
      const studentEvidences = (db.evidences || []).filter((e) => e.studentProfileId === profileId && e.status === 'processed');

      const items = [];
      let matchedCount = 0;
      let partialCount = 0;
      let missingCount = 0;
      let gapCount = 0;

      for (const req of reqs) {
        const studentSkill = studentSkills.find((ss) => ss.skillId === req.skillId);
        const relatedEvidences = studentEvidences.filter((e) => e.skillId === req.skillId);

        let status = 'gap';
        let reason = '';
        const level = studentSkill ? studentSkill.level : 'None';

        if (studentSkill && relatedEvidences.length > 0) {
          if (level === 'Advanced' || level === 'Intermediate') {
            status = 'matched';
            reason = `Strong match: recorded at ${level} level and supported by ${relatedEvidences.length} verified project artifact(s).`;
            matchedCount++;
          } else {
            status = 'partial';
            reason = `Partial match: recorded at Beginner level with introductory practical evidence.`;
            partialCount++;
          }
        } else if (studentSkill && relatedEvidences.length === 0) {
          status = 'missing_evidence';
          reason = `Claimed at ${level} level, but no verified evidence file has been uploaded yet to substantiate this skill.`;
          missingCount++;
        } else if (relatedEvidences.length > 0) {
          status = 'partial';
          reason = `Evidence found in project files, but skill is not explicitly tracked in profile.`;
          partialCount++;
        } else {
          status = 'gap';
          reason = `Skill required by circular was not found in your recorded profile or uploaded artifacts.`;
          gapCount++;
        }

        const supporting = relatedEvidences.map((e) => ({
          evidenceId: e.id || e._id,
          title: e.title,
          snippet: e.extractedText || e.description,
          confidence: status === 'matched' ? 0.94 : 0.65
        }));

        items.push({
          id: generateId(),
          skillId: req.skillId,
          skillName: req.skillName,
          category: req.category || 'Technical',
          status,
          aiStatus: status,
          studentLevel: level,
          supportingEvidence: supporting,
          reason,
          isFlagged: false
        });
      }

      const totalRequired = Math.max(1, reqs.length);
      const matchScore = Math.min(100, Math.round(((matchedCount * 1.0 + partialCount * 0.5) / totalRequired) * 100));

      const reportId = generateId();
      const report = {
        id: reportId,
        _id: reportId,
        studentProfileId: profileId,
        circularId: circular.id || circular._id,
        jobTitle: circular.title,
        company: circular.company,
        matchScore,
        totalRequired: reqs.length,
        matchedCount,
        partialCount,
        missingCount,
        gapCount,
        items,
        disclaimer: 'This report is an AI-generated guidance tool based on your uploaded evidence. It does not represent an official hiring or accreditation decision.',
        createdAt: new Date().toISOString()
      };

      circular.status = 'analyzed';
      db.reports.push(report);
      writeDb(db);

      return res.status(201).json({ success: true, data: report });
    }

    const circular = await JobCircular.findOne({ _id: id, studentProfileId: profileId });
    if (!circular) {
      return res.status(404).json({ success: false, error: { message: 'Job circular not found.' } });
    }

    const reqs = await JobRequirement.find({ circularId: circular._id, confirmed: true });
    const studentSkills = await StudentSkill.find({ studentProfileId: profileId });
    const studentEvidences = await Evidence.find({ studentProfileId: profileId, status: 'processed' });

    const items = [];
    let matchedCount = 0;
    let partialCount = 0;
    let missingCount = 0;
    let gapCount = 0;

    for (const req of reqs) {
      const studentSkill = studentSkills.find((ss) => ss.skillId.toString() === req.skillId.toString());
      const relatedEvidences = studentEvidences.filter((e) => e.skillId.toString() === req.skillId.toString());

      let status = 'gap';
      let reason = '';
      const level = studentSkill ? studentSkill.level : 'None';

      if (studentSkill && relatedEvidences.length > 0) {
        if (level === 'Advanced' || level === 'Intermediate') {
          status = 'matched';
          reason = `Strong match: recorded at ${level} level and supported by ${relatedEvidences.length} verified project artifact(s).`;
          matchedCount++;
        } else {
          status = 'partial';
          reason = `Partial match: recorded at Beginner level with introductory practical evidence.`;
          partialCount++;
        }
      } else if (studentSkill && relatedEvidences.length === 0) {
        status = 'missing_evidence';
        reason = `Claimed at ${level} level, but no verified evidence file has been uploaded yet to substantiate this skill.`;
        missingCount++;
      } else if (relatedEvidences.length > 0) {
        status = 'partial';
        reason = `Evidence found in project files, but skill is not explicitly tracked in profile.`;
        partialCount++;
      } else {
        status = 'gap';
        reason = `Skill required by circular was not found in your recorded profile or uploaded artifacts.`;
        gapCount++;
      }

      const supporting = relatedEvidences.map((e) => ({
        evidenceId: e._id.toString(),
        title: e.title,
        snippet: e.extractedText || e.description,
        confidence: status === 'matched' ? 0.94 : 0.65
      }));

      items.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: 'Technical',
        status,
        aiStatus: status,
        studentLevel: level,
        supportingEvidence: supporting,
        reason,
        isFlagged: false
      });
    }

    const totalRequired = Math.max(1, reqs.length);
    const matchScore = Math.min(100, Math.round(((matchedCount * 1.0 + partialCount * 0.5) / totalRequired) * 100));

    const report = await SkillGapReport.create({
      studentProfileId: profileId,
      circularId: circular._id,
      jobTitle: circular.title,
      company: circular.company,
      matchScore,
      totalRequired: reqs.length,
      matchedCount,
      partialCount,
      missingCount,
      gapCount,
      items
    });

    circular.status = 'analyzed';
    await circular.save();

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
