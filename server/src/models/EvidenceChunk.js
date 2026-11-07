const mongoose = require('mongoose');

const evidenceChunkSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      required: true,
      index: true
    },
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
      index: true
    },
    index: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      select: false,
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EvidenceChunk', evidenceChunkSchema);
