const mongoose = require('mongoose');

const gapItemSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    skillName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'Technical'
    },
    status: {
      type: String,
      enum: ['matched', 'partial', 'missing_evidence', 'gap'],
      required: true
    },
    aiStatus: {
      type: String
    },
    studentLevel: {
      type: String,
      default: 'None'
    },
    supportingEvidence: [
      {
        evidenceId: String,
        title: String,
        snippet: String,
        confidence: Number
      }
    ],
    reason: {
      type: String
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const skillGapReportSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true
    },
    circularId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCircular',
      required: true
    },
    jobTitle: {
      type: String,
      required: true
    },
    company: {
      type: String,
      default: 'Target Company'
    },
    matchScore: {
      type: Number,
      default: 0
    },
    totalRequired: {
      type: Number,
      default: 0
    },
    matchedCount: {
      type: Number,
      default: 0
    },
    partialCount: {
      type: Number,
      default: 0
    },
    missingCount: {
      type: Number,
      default: 0
    },
    gapCount: {
      type: Number,
      default: 0
    },
    items: [gapItemSchema],
    disclaimer: {
      type: String,
      default: 'This report is an AI-generated guidance tool based on your uploaded evidence. It does not represent an official hiring or accreditation decision.'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.SkillGapReport || mongoose.model('SkillGapReport', skillGapReportSchema);
