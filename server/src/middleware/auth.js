const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { readDb } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Please log in.'
        }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session expired or invalid token. Please log in again.'
        }
      });
    }

    const userId = decoded.sub || decoded.id;

    if (!isMongoReady()) {
      const db = readDb();
      const user = db.users.find((u) => u.id === userId || u._id === userId);
      if (!user || user.isActive === false) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'User account not found or deactivated.' }
        });
      }
      const profile = db.profiles.find((p) => p.userId === userId);
      req.user = {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        profileId: profile ? (profile.id || profile._id) : null
      };
      return next();
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User account not found or deactivated.'
        }
      });
    }

    const profile = await StudentProfile.findOne({ userId: user._id });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profileId: profile ? profile._id.toString() : null
    };

    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions.'
        }
      });
    }
    next();
  };
}

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: details[0]?.message || 'Input validation failed',
          details
        }
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  validate
};
