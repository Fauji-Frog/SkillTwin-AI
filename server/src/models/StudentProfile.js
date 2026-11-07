const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    batch: {
      type: String,
      default: ''
    },
    section: {
      type: String,
      default: ''
    },
    careerInterests: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.StudentProfile || mongoose.model('StudentProfile', studentProfileSchema);
