const mongoose = require('mongoose');
const SkillGapReport = require('../models/SkillGapReport');
const { readDb, writeDb } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

exports.getReports = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!isMongoReady()) {
      const db = readDb();
      const list = (db.reports || []).filter((r) => r.studentProfileId === profileId).reverse();
      return res.status(200).json({ success: true, data: list });
    }

    const list = await SkillGapReport.find({ studentProfileId: profileId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const report = db.reports.find((r) => (r.id === id || r._id === id) && r.studentProfileId === profileId);
      if (!report) {
        return res.status(404).json({ success: false, error: { message: 'Skill-gap report not found.' } });
      }
      return res.status(200).json({ success: true, data: report });
    }

    const report = await SkillGapReport.findOne({ _id: id, studentProfileId: profileId });
    if (!report) {
      return res.status(404).json({ success: false, error: { message: 'Skill-gap report not found.' } });
    }
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

exports.flagReportItem = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id, itemId } = req.params;
    const { reason, correctedStatus } = req.body;

    if (!isMongoReady()) {
      const db = readDb();
      const report = db.reports.find((r) => (r.id === id || r._id === id) && r.studentProfileId === profileId);
      if (!report) {
        return res.status(404).json({ success: false, error: { message: 'Report not found' } });
      }
      const item = (report.items || []).find((it) => it.id === itemId || it._id === itemId);
      if (item) {
        item.isFlagged = true;
        item.flagReason = reason || 'Reviewed by student';
        if (correctedStatus) item.status = correctedStatus;
        writeDb(db);
      }
      return res.status(200).json({ success: true, data: report });
    }

    const report = await SkillGapReport.findOne({ _id: id, studentProfileId: profileId });
    if (!report) {
      return res.status(404).json({ success: false, error: { message: 'Report not found' } });
    }

    const item = report.items.id(itemId);
    if (item) {
      item.isFlagged = true;
      item.flagReason = reason || 'Reviewed by student';
      if (correctedStatus) item.status = correctedStatus;
      await report.save();
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
