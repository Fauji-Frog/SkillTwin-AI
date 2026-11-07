const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { readDb, writeDb } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!isMongoReady()) {
      const db = readDb();
      const profile = db.profiles.find((p) => p.userId === userId);
      const user = db.users.find((u) => u.id === userId || u._id === userId);
      return res.status(200).json({
        success: true,
        data: {
          user: { name: user?.name, email: user?.email },
          profile: profile || {
            studentId: '',
            department: 'Computer Science & Engineering',
            batch: '42-B1',
            section: 'B1',
            careerInterests: []
          }
        }
      });
    }

    const profile = await StudentProfile.findOne({ userId });
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        user: { name: user?.name, email: user?.email },
        profile: profile || {}
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { studentId, department, batch, section, careerInterests } = req.body;

    if (!isMongoReady()) {
      const db = readDb();
      let profile = db.profiles.find((p) => p.userId === userId);
      if (!profile) {
        profile = {
          id: userId,
          userId,
          studentId: '',
          department: '',
          batch: '',
          section: '',
          careerInterests: []
        };
        db.profiles.push(profile);
      }

      if (studentId !== undefined) profile.studentId = studentId.trim();
      if (department !== undefined) profile.department = department.trim();
      if (batch !== undefined) profile.batch = batch.trim();
      if (section !== undefined) profile.section = section.trim();
      if (careerInterests !== undefined) profile.careerInterests = Array.isArray(careerInterests) ? careerInterests : [];

      profile.updatedAt = new Date().toISOString();
      writeDb(db);

      return res.status(200).json({
        success: true,
        data: profile
      });
    }

    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId });
    }

    if (studentId !== undefined) profile.studentId = studentId.trim();
    if (department !== undefined) profile.department = department.trim();
    if (batch !== undefined) profile.batch = batch.trim();
    if (section !== undefined) profile.section = section.trim();
    if (careerInterests !== undefined) profile.careerInterests = Array.isArray(careerInterests) ? careerInterests : [];

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};
