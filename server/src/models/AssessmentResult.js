const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema(
  {
    studentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    skillName: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percent: { type: Number, required: true },
    estimatedLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    levelBasis: { type: String, default: 'score_only' },
    feedback: [{ questionIndex: Number, correct: Boolean, explanation: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', assessmentResultSchema);
