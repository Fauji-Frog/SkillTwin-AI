const fs = require('fs');
const path = require('path');
const Skill = require('../models/Skill');

/**
 * Extracts plain text from an uploaded evidence file
 */
const extractTextFromFile = async (filePath, mimeType, extension) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { status: 'failed', text: '', message: 'File not found on disk' };
    }

    // Text & code files can be read directly
    const textExtensions = ['.txt', '.js', '.py', '.java', '.sql', '.cpp', '.c', '.cs', '.html', '.css', '.json', '.md'];
    if (textExtensions.includes(extension.toLowerCase())) {
      const text = fs.readFileSync(filePath, 'utf-8');
      if (text.trim().length < 20) {
        return { status: 'failed', text, message: 'Extracted text is too short (< 20 characters)' };
      }
      return { status: 'processed', text, message: null };
    }

    // Binary / doc files - read readable strings buffer extraction for local dev/demo
    const buffer = fs.readFileSync(filePath);
    // Extract ascii/utf8 strings from binary buffer
    const text = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\r\n]/g, ' ');
    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length < 20) {
      // If unsupported image or unparseable format
      if (['.png', '.jpg', '.jpeg'].includes(extension.toLowerCase())) {
        return { status: 'unsupported', text: '', message: 'Image evidence OCR is not supported. Please upload PDF, DOCX, or code files.' };
      }
      return { status: 'failed', text: '', message: 'Could not extract valid text from file' };
    }

    return { status: 'processed', text: cleanText, message: null };
  } catch (error) {
    return { status: 'failed', text: '', message: error.message };
  }
};

/**
 * Splits text into chunks (~800 characters)
 */
const chunkText = (text, chunkSize = 800, overlap = 100) => {
  const chunks = [];
  if (!text) return chunks;

  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkContent = text.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index,
        text: chunkContent
      });
      index++;
    }
    start += (chunkSize - overlap);
  }

  return chunks;
};

/**
 * Extracts required skills from a job circular text against the master catalog
 */
const extractSkillsFromJobText = async (text) => {
  const allSkills = await Skill.find({ isActive: true });
  const matched = [];
  const lowerText = text.toLowerCase();

  for (const skill of allSkills) {
    const terms = [skill.name, ...(skill.synonyms || [])];
    let isFound = false;
    let foundTerm = skill.name;

    for (const term of terms) {
      // Word boundary match
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, 'i');
      if (regex.test(lowerText)) {
        isFound = true;
        foundTerm = term;
        break;
      }
    }

    if (isFound) {
      matched.push({
        skillId: skill._id,
        name: skill.name,
        category: skill.category,
        matchedTerm: foundTerm,
        confidence: 0.95
      });
    }
  }

  return matched;
};

/**
 * Core Gap Analysis Engine
 * Compares job requirements with student's recorded skills and verified evidence
 */
const runGapAnalysis = async (requirements, studentSkills, studentEvidences) => {
  const gapItems = [];
  let matchedCount = 0;
  let partialCount = 0;
  let missingEvidenceCount = 0;
  let gapCount = 0;

  const skillMap = new Map();
  studentSkills.forEach(ss => {
    skillMap.set(ss.skillId.toString(), ss);
  });

  const evidenceMap = new Map();
  studentEvidences.forEach(ev => {
    const sid = ev.skillId.toString();
    if (!evidenceMap.has(sid)) {
      evidenceMap.set(sid, []);
    }
    evidenceMap.get(sid).push(ev);
  });

  for (const req of requirements) {
    const skillIdStr = req.skillId._id ? req.skillId._id.toString() : req.skillId.toString();
    const skillName = req.skillId.name || req.matchedTerm;
    const recorded = skillMap.get(skillIdStr);
    const evidences = evidenceMap.get(skillIdStr) || [];
    const validEvidence = evidences.find(e => e.status === 'processed');

    let status = 'gap';
    let studentLevel = 'None';
    let supportingEvidenceId = null;
    let evidenceSnippet = null;
    let reason = '';

    if (recorded && validEvidence) {
      // Has skill AND verified evidence
      studentLevel = recorded.level || 'Beginner';
      supportingEvidenceId = validEvidence._id;
      evidenceSnippet = validEvidence.description || `Verified via ${validEvidence.title}`;

      if (studentLevel === 'Advanced' || studentLevel === 'Intermediate') {
        status = 'matched';
        matchedCount++;
        reason = `Strong match: Demonstrated ${studentLevel} proficiency with verified evidence (${validEvidence.title}).`;
      } else {
        status = 'partial';
        partialCount++;
        reason = `Partial match: Recorded as Beginner with verified evidence (${validEvidence.title}). Consider strengthening toward Intermediate.`;
      }
    } else if (recorded && !validEvidence) {
      // Has skill BUT no valid evidence (Hard rule: missing evidence)
      studentLevel = recorded.level || 'Beginner';
      status = 'missing_evidence';
      missingEvidenceCount++;
      reason = `Skill recorded as ${studentLevel}, but no verified evidence is attached yet. Upload project code or lab proof to claim this skill.`;
    } else {
      // Skill not recorded at all
      status = 'gap';
      gapCount++;
      reason = `Skill gap: ${skillName} is required by this job circular but is not in your recorded skill profile.`;
    }

    gapItems.push({
      skillId: req.skillId._id || req.skillId,
      status,
      studentLevel,
      supportingEvidenceId,
      evidenceSnippet,
      reason
    });
  }

  const totalRequired = requirements.length;
  const matchScore = totalRequired > 0
    ? Math.min(100, Math.round(((matchedCount * 1.0 + partialCount * 0.5) / totalRequired) * 100))
    : 0;

  let summary = `Your skill match score for this position is ${matchScore}%. You have ${matchedCount} verified skill(s) ready, ${partialCount} partial match(es), ${missingEvidenceCount} skill(s) pending evidence proof, and ${gapCount} skill gap(s).`;

  return {
    matchScore,
    totalRequired,
    matchedCount,
    partialCount,
    missingEvidenceCount,
    gapCount,
    summary,
    gapItems
  };
};

module.exports = {
  extractTextFromFile,
  chunkText,
  extractSkillsFromJobText,
  runGapAnalysis
};
