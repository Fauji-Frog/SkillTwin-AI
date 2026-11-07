const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id ? user._id.toString() : user.id,
      id: user._id ? user._id.toString() : user.id,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, studentId } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isMongoReady()) {
      const db = readDb();
      const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'An account with this email address already exists.'
          }
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = generateId();
      const profileId = generateId();

      const newUser = {
        id: userId,
        _id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'student',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newProfile = {
        id: profileId,
        _id: profileId,
        userId,
        studentId: studentId ? studentId.trim() : '',
        department: '',
        batch: '',
        section: '',
        careerInterests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.users.push(newUser);
      db.profiles.push(newProfile);
      writeDb(db);

      const token = generateToken(newUser);
      setAuthCookie(res, token);

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
          profile: {
            id: newProfile.id,
            studentId: newProfile.studentId,
            department: newProfile.department
          },
          token
        }
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'An account with this email address already exists.'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      isActive: true
    });

    const profile = await StudentProfile.create({
      userId: user._id,
      studentId: studentId ? studentId.trim() : '',
      department: '',
      batch: '',
      section: '',
      careerInterests: []
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        },
        profile: {
          id: profile._id.toString(),
          studentId: profile.studentId,
          department: profile.department
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isMongoReady()) {
      const db = readDb();
      const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Invalid email or password.'
          }
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DEACTIVATED',
            message: 'Your account has been deactivated. Please contact the administrator.'
          }
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Invalid email or password.'
          }
        });
      }

      user.lastLoginAt = new Date().toISOString();
      writeDb(db);

      const profile = db.profiles.find((p) => p.userId === (user.id || user._id));
      const token = generateToken(user);
      setAuthCookie(res, token);

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          profile: profile
            ? {
                id: profile.id || profile._id,
                studentId: profile.studentId,
                department: profile.department
              }
            : null,
          token
        }
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password.'
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Please contact the administrator.'
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password.'
        }
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const profile = await StudentProfile.findOne({ userId: user._id });
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        },
        profile: profile
          ? {
              id: profile._id.toString(),
              studentId: profile.studentId,
              department: profile.department
            }
          : null,
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production'
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

exports.getMe = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      const db = readDb();
      const profile = db.profiles.find((p) => p.userId === req.user.id);
      return res.status(200).json({
        success: true,
        data: {
          user: req.user,
          profile: profile || null
        }
      });
    }

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile: profile || null
      }
    });
  } catch (err) {
    next(err);
  }
};
