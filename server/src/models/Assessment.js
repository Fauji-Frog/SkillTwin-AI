const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  points: { type: Number, default: 1 },
  explanation: { type: String }
});

const assessmentSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'Technical' },
    type: { type: String, enum: ['quiz', 'practical'], default: 'quiz' },
    questions: [questionSchema],
    scoringRule: { type: String, default: '1 point per question. Beginner <40%, Intermediate 40-74%, Advanced >=75%' },
    levelCutoffs: {
      intermediate: { type: Number, default: 40 },
      advanced: { type: Number, default: 75 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
