const mongoose = require('mongoose');

const gapItemSchema = new mongoose.Schema(
  {
    skillGapReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillGapReport',
      required: true,
      index: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    status: {
      type: String,
      enum: ['matched', 'partial', 'missing_evidence', 'gap'],
      required: true
    },
    studentLevel: {
      type: String,
      default: 'None'
    },
    supportingEvidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      default: null
    },
    evidenceSnippet: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      required: true
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GapItem', gapItemSchema);
