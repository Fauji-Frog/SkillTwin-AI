const mongoose = require('mongoose');

const studentSkillSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    levelSource: {
      type: String,
      enum: ['self', 'estimated'],
      default: 'self'
    },
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

studentSkillSchema.index({ studentProfileId: 1, skillId: 1 }, { unique: true });

module.exports = mongoose.models.StudentSkill || mongoose.model('StudentSkill', studentSkillSchema);
