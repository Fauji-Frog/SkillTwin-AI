const JobCircular = require('../models/JobCircular');
const JobRequirement = require('../models/JobRequirement');
const Skill = require('../models/Skill');
const aiService = require('../services/aiService');

const submitJobCircular = async (req, res, next) => {
  try {
    const studentProfileId = req.user.profileId;
    let { title, company, rawText } = req.body;
    let sourceType = 'pasted';

    if (req.file) {
      sourceType = 'file';
      const extraction = await aiService.extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);
      rawText = extraction.text;
      if (!title) {
        title = req.file.originalname.replace(/\.[^/.]+$/, '');
      }
    }

    if (!title || !rawText || rawText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Job title and valid circular text are required.' }
      });
    }

    // 1. Create JobCircular
    const circular = await JobCircular.create({
      studentProfileId,
      title: title.trim(),
      company: company && company.trim().length > 0 ? company.trim() : 'Industry Employer',
      rawText: rawText.trim(),
      sourceType,
      status: 'draft'
    });

    // 2. Extract skills using AI service
    const extractedSkills = await aiService.extractSkillsFromJobText(rawText);

    // 3. Create JobRequirements
    const requirements = [];
    for (const item of extractedSkills) {
      const reqDoc = await JobRequirement.create({
        jobCircularId: circular._id,
        skillId: item.skillId,
        matchedTerm: item.matchedTerm,
        confidence: item.confidence,
        isConfirmed: true
      });
      requirements.push(reqDoc);
    }

    const populatedReqs = await JobRequirement.find({ jobCircularId: circular._id }).populate('skillId');

    return res.status(201).json({
      success: true,
      data: {
        circular,
        requirements: populatedReqs
      }
    });
  } catch (error) {
    next(error);
  }
};

const getJobCirculars = async (req, res, next) => {
  try {
    const studentProfileId = req.user.profileId;
    const circulars = await JobCircular.find({ studentProfileId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: circulars });
  } catch (error) {
    next(error);
  }
};

const getJobCircularById = async (req, res, next) => {
  try {
    const studentProfileId = req.user.profileId;
    const { id } = req.params;

    const circular = await JobCircular.findOne({ _id: id, studentProfileId });
    if (!circular) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job circular not found' }
      });
    }

    const requirements = await JobRequirement.find({ jobCircularId: id }).populate('skillId');

    return res.status(200).json({
      success: true,
      data: {
        circular,
        requirements
      }
    });
  } catch (error) {
    next(error);
  }
};

const toggleRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isConfirmed } = req.body;

    const requirement = await JobRequirement.findById(id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Requirement not found' }
      });
    }

    requirement.isConfirmed = isConfirmed !== undefined ? isConfirmed : !requirement.isConfirmed;
    await requirement.save();

    const populated = await JobRequirement.findById(id).populate('skillId');
    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const addRequirementManually = async (req, res, next) => {
  try {
    const { id } = req.params; // circular id
    const { skillId } = req.body;

    const circular = await JobCircular.findOne({ _id: id, studentProfileId: req.user.profileId });
    if (!circular) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job circular not found' }
      });
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Skill not found in catalog' }
      });
    }

    const existing = await JobRequirement.findOne({ jobCircularId: id, skillId });
    if (existing) {
      existing.isConfirmed = true;
      await existing.save();
      const populated = await JobRequirement.findById(existing._id).populate('skillId');
      return res.status(200).json({ success: true, data: populated });
    }

    const newReq = await JobRequirement.create({
      jobCircularId: id,
      skillId,
      matchedTerm: skill.name,
      confidence: 1.0,
      isConfirmed: true
    });

    const populated = await JobRequirement.findById(newReq._id).populate('skillId');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitJobCircular,
  getJobCirculars,
  getJobCircularById,
  toggleRequirement,
  addRequirementManually
};
