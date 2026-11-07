const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const StudentSkill = require('../models/StudentSkill');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

exports.getAllSkills = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      const db = readDb();
      return res.status(200).json({ success: true, data: db.skills || [] });
    }

    let skills = await Skill.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: skills });
  } catch (err) {
    next(err);
  }
};

exports.getStudentSkills = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;

    if (!isMongoReady()) {
      const db = readDb();
      const list = (db.studentSkills || [])
        .filter((ss) => ss.studentProfileId === profileId)
        .map((ss) => {
          const skill = db.skills.find((s) => s.id === ss.skillId || s._id === ss.skillId);
          return {
            ...ss,
            skill: skill || { name: 'Skill', category: 'General' }
          };
        });
      return res.status(200).json({ success: true, data: list });
    }

    const studentSkills = await StudentSkill.find({ studentProfileId: profileId })
      .populate('skillId')
      .sort({ createdAt: -1 });

    const formatted = studentSkills.map((item) => ({
      id: item._id.toString(),
      _id: item._id.toString(),
      skillId: item.skillId?._id?.toString() || item.skillId,
      skill: item.skillId,
      level: item.level,
      levelSource: item.levelSource,
      note: item.note,
      createdAt: item.createdAt
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.addStudentSkill = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { skillId, level = 'Beginner', note = '' } = req.body;

    if (!skillId) {
      return res.status(400).json({ success: false, error: { message: 'skillId is required' } });
    }

    if (!isMongoReady()) {
      const db = readDb();
      const exists = (db.studentSkills || []).some(
        (ss) => ss.studentProfileId === profileId && (ss.skillId === skillId || ss.skillId === skillId)
      );
      if (exists) {
        return res.status(409).json({ success: false, error: { message: 'Skill already added to your profile.' } });
      }

      const id = generateId();
      const newSS = {
        id,
        _id: id,
        studentProfileId: profileId,
        skillId,
        level,
        levelSource: 'self',
        note,
        createdAt: new Date().toISOString()
      };
      db.studentSkills.push(newSS);
      writeDb(db);
      return res.status(201).json({ success: true, data: newSS });
    }

    const existing = await StudentSkill.findOne({ studentProfileId: profileId, skillId });
    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'Skill already added to your profile.' } });
    }

    const created = await StudentSkill.create({
      studentProfileId: profileId,
      skillId,
      level,
      levelSource: 'self',
      note
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

exports.deleteStudentSkill = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      db.studentSkills = (db.studentSkills || []).filter(
        (ss) => !(ss.id === id || ss._id === id) || ss.studentProfileId !== profileId
      );
      writeDb(db);
      return res.status(200).json({ success: true, message: 'Skill removed' });
    }

    await StudentSkill.findOneAndDelete({ _id: id, studentProfileId: profileId });
    res.status(200).json({ success: true, message: 'Skill removed' });
  } catch (err) {
    next(err);
  }
};
