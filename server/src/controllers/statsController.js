const mongoose = require('mongoose');
const StudentSkill = require('../models/StudentSkill');
const Evidence = require('../models/Evidence');
const SkillGapReport = require('../models/SkillGapReport');
const JobCircular = require('../models/JobCircular');
const { readDb } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

exports.getDashboardStats = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!profileId) {
      return res.status(200).json({
        success: true,
        data: {
          coverage: 0,
          recordedSkills: 0,
          processedEvidence: 0,
          reportsGenerated: 0,
          skillsToStrengthen: [],
          latestAnalysis: null,
          latestReport: null
        }
      });
    }

    if (!isMongoReady()) {
      const db = readDb();
      const studentSkills = (db.studentSkills || []).filter((ss) => ss.studentProfileId === profileId);
      const evidences = (db.evidences || []).filter((e) => e.studentProfileId === profileId);
      const processedEvidences = evidences.filter((e) => e.status === 'processed');
      const reports = (db.reports || []).filter((r) => r.studentProfileId === profileId);
      const circulars = (db.jobCirculars || []).filter((c) => c.studentProfileId === profileId);

      const recordedCount = studentSkills.length;
      const processedCount = processedEvidences.length;
      const reportsCount = reports.length;

      // Evidence coverage: percentage of recorded skills backed by at least 1 processed evidence
      const skillsWithEvidence = studentSkills.filter((ss) =>
        processedEvidences.some((e) => e.skillId === ss.skillId)
      );
      const coverage = recordedCount > 0 ? Math.round((skillsWithEvidence.length / recordedCount) * 100) : 0;

      // Real skills to strengthen for this specific student
      const toStrengthen = studentSkills
        .filter((ss) => {
          const hasEv = processedEvidences.some((e) => e.skillId === ss.skillId);
          return ss.level === 'Beginner' || !hasEv;
        })
        .map((ss) => {
          const skillObj = (db.skills || []).find((s) => s.id === ss.skillId || s._id === ss.skillId);
          return {
            name: skillObj ? skillObj.name : 'Recorded Skill',
            category: skillObj ? skillObj.category : 'Technical',
            level: ss.level,
            hasEvidence: processedEvidences.some((e) => e.skillId === ss.skillId)
          };
        })
        .slice(0, 4);

      const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
      const latestCircular = circulars.length > 0 ? circulars[circulars.length - 1] : null;

      return res.status(200).json({
        success: true,
        data: {
          coverage,
          recordedSkills: recordedCount,
          processedEvidence: processedCount,
          reportsGenerated: reportsCount,
          skillsToStrengthen: toStrengthen,
          latestAnalysis: latestCircular ? latestCircular.title : (latestReport ? latestReport.jobTitle : null),
          latestReport: latestReport ? {
            id: latestReport.id || latestReport._id,
            jobTitle: latestReport.jobTitle,
            company: latestReport.company,
            matchScore: latestReport.matchScore,
            totalRequired: latestReport.totalRequired,
            matchedCount: latestReport.matchedCount,
            missingCount: latestReport.missingCount,
            createdAt: latestReport.createdAt
          } : null
        }
      });
    }

    // Mongoose query mode
    const studentSkills = await StudentSkill.find({ studentProfileId: profileId }).populate('skillId');
    const evidences = await Evidence.find({ studentProfileId: profileId });
    const processedEvidences = evidences.filter((e) => e.status === 'processed');
    const reports = await SkillGapReport.find({ studentProfileId: profileId }).sort({ createdAt: -1 });
    const latestCircular = await JobCircular.findOne({ studentProfileId: profileId }).sort({ createdAt: -1 });

    const recordedCount = studentSkills.length;
    const processedCount = processedEvidences.length;
    const reportsCount = reports.length;

    const skillsWithEvidence = studentSkills.filter((ss) =>
      processedEvidences.some((e) => e.skillId?.toString() === (ss.skillId?._id?.toString() || ss.skillId?.toString()))
    );
    const coverage = recordedCount > 0 ? Math.round((skillsWithEvidence.length / recordedCount) * 100) : 0;

    const toStrengthen = studentSkills
      .filter((ss) => {
        const hasEv = processedEvidences.some((e) => e.skillId?.toString() === (ss.skillId?._id?.toString() || ss.skillId?.toString()));
        return ss.level === 'Beginner' || !hasEv;
      })
      .map((ss) => ({
        name: ss.skillId?.name || 'Skill',
        category: ss.skillId?.category || 'Technical',
        level: ss.level,
        hasEvidence: processedEvidences.some((e) => e.skillId?.toString() === (ss.skillId?._id?.toString() || ss.skillId?.toString()))
      }))
      .slice(0, 4);

    const latestReport = reports.length > 0 ? reports[0] : null;

    res.status(200).json({
      success: true,
      data: {
        coverage,
        recordedSkills: recordedCount,
        processedEvidence: processedCount,
        reportsGenerated: reportsCount,
        skillsToStrengthen: toStrengthen,
        latestAnalysis: latestCircular ? latestCircular.title : (latestReport ? latestReport.jobTitle : null),
        latestReport: latestReport ? {
          id: latestReport._id.toString(),
          jobTitle: latestReport.jobTitle,
          company: latestReport.company,
          matchScore: latestReport.matchScore,
          totalRequired: latestReport.totalRequired,
          matchedCount: latestReport.matchedCount,
          missingCount: latestReport.missingCount,
          createdAt: latestReport.createdAt
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
};
