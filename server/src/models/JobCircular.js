const mongoose = require('mongoose');

const jobCircularSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true,
      default: 'Target Company'
    },
    rawText: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'analyzed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.JobCircular || mongoose.model('JobCircular', jobCircularSchema);
