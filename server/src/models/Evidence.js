const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    evidenceType: {
      type: String,
      enum: ['report', 'certificate', 'code', 'other'],
      default: 'report'
    },
    originalName: {
      type: String,
      required: true
    },
    storedName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String
    },
    sizeBytes: {
      type: Number
    },
    extension: {
      type: String
    },
    status: {
      type: String,
      enum: ['processing', 'processed', 'unsupported', 'failed'],
      default: 'processing'
    },
    statusMessage: {
      type: String,
      default: null
    },
    extractedText: {
      type: String,
      select: false
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Evidence || mongoose.model('Evidence', evidenceSchema);
