const mongoose = require('mongoose');

const jobRequirementSchema = new mongoose.Schema(
  {
    circularId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCircular',
      required: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    skillName: {
      type: String,
      required: true
    },
    importance: {
      type: String,
      enum: ['required', 'preferred'],
      default: 'required'
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.JobRequirement || mongoose.model('JobRequirement', jobRequirementSchema);
