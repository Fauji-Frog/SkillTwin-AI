const mongoose = require('mongoose');

const pathStepSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  resourceType: { type: String, default: 'course' },
  url: { type: String, required: true },
  level: { type: String, default: 'Beginner' },
  practiceTask: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  gapType: { type: String, enum: ['gap', 'missing_evidence', 'partial'], default: 'gap' }
});

const learningPathSchema = new mongoose.Schema(
  {
    studentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillGapReport', required: true },
    jobTitle: { type: String, required: true },
    targetRole: { type: String },
    steps: [pathStepSchema],
    completedSteps: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.LearningPath || mongoose.model('LearningPath', learningPathSchema);
