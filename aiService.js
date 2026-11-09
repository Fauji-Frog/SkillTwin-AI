const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from an uploaded evidence or circular file
 * Supports: PDF, DOCX, TXT, JS, JSX, TS, TSX, PY, JAVA, SQL, JSON, MD, HTML, CSS, C, CPP
 */
const extractTextFromFile = async (filePath, mimeType, extension) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { status: 'failed', text: '', message: 'File not found on disk' };
    }

    const ext = (extension || path.extname(filePath)).toLowerCase();

    // 1. Text & Source Code Files
    const codeExtensions = [
      '.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.java',
      '.sql', '.cpp', '.c', '.cs', '.html', '.css', '.json', '.md'
    ];
    if (codeExtensions.includes(ext)) {
      const rawText = await fs.promises.readFile(filePath, 'utf-8');
      const text = rawText.trim();
      if (text.length < 10) {
        return { status: 'failed', text, message: 'Extracted text is too short (< 10 characters)' };
      }
      return { status: 'processed', text, message: null };
    }

    // 2. PDF Documents
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const buffer = await fs.promises.readFile(filePath);
        const pdfData = await pdf(buffer);
        const text = (pdfData.text || '').replace(/\s+/g, ' ').trim();
        if (text.length < 10) {
          return { status: 'failed', text, message: 'Could not extract readable text from PDF (empty or scanned image)' };
        }
        return { status: 'processed', text, message: null };
      } catch (pdfErr) {
        // Fallback for encrypted/corrupt PDFs
        return { status: 'failed', text: '', message: `PDF parsing error: ${pdfErr.message}` };
      }
    }

    // 3. DOCX Documents
    if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = (result.value || '').replace(/\s+/g, ' ').trim();
        if (text.length < 10) {
          return { status: 'failed', text, message: 'DOCX file contains no readable text' };
        }
        return { status: 'processed', text, message: null };
      } catch (docxErr) {
        return { status: 'failed', text: '', message: `DOCX parsing error: ${docxErr.message}` };
      }
    }

    // Unsupported format
    return {
      status: 'unsupported',
      text: '',
      message: `Unsupported file format '${ext}'. Please upload PDF, DOCX, TXT, or source code files.`
    };
  } catch (err) {
    return { status: 'failed', text: '', message: err.message };
  }
};

/**
 * Splits text into chunks (~500 characters with 50 characters overlap)
 */
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  if (!text || typeof text !== 'string') return chunks;

  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return chunks;

  let start = 0;
  let index = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunkContent = clean.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index,
        text: chunkContent
      });
      index++;
    }
    if (end >= clean.length) break;
    start += (chunkSize - overlap);
  }

  return chunks;
};

/**
 * Extracts skills from job text using word-boundary matching against the catalog
 */
const extractSkillsFromText = (text, skillsCatalog = []) => {
  if (!text || typeof text !== 'string') return [];
  const lowerText = text.toLowerCase();
  const matched = [];
  const seenIds = new Set();

  for (const skill of skillsCatalog) {
    const sId = (skill.id || skill._id || '').toString();
    if (seenIds.has(sId)) continue;

    const terms = [skill.name, ...(skill.synonyms || [])];
    let isFound = false;
    let matchedTerm = skill.name;

    for (const term of terms) {
      if (!term) continue;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Accurate word boundary regex supporting symbols like C#, C++, Node.js
      const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, 'i');
      if (regex.test(lowerText)) {
        isFound = true;
        matchedTerm = term;
        break;
      }
    }

    if (isFound) {
      seenIds.add(sId);
      matched.push({
        skillId: skill.id || skill._id,
        skillName: skill.name,
        category: skill.category || 'Technical',
        matchedTerm,
        importance: 'required',
        confirmed: false // Default to unconfirmed per FR-09
      });
    }
  }

  return matched;
};

/**
 * Core Gap Analysis Engine
 * Searches both explicit skill tags AND actual extracted evidence text chunks
 */
const runGapAnalysis = ({
  requirements = [],
  studentSkills = [],
  studentEvidences = [],
  evidenceChunks = []
}) => {
  const startTime = Date.now();
  const gapItems = [];
  let matchedCount = 0;
  let partialCount = 0;
  let missingCount = 0;
  let gapCount = 0;

  // Map of student's claimed skills
  const studentSkillMap = new Map();
  studentSkills.forEach((ss) => {
    const sId = (ss.skillId?._id || ss.skillId?.id || ss.skillId || '').toString();
    studentSkillMap.set(sId, ss);
  });

  for (const req of requirements) {
    const reqSkillId = (req.skillId?._id || req.skillId?.id || req.skillId || '').toString();
    const skillName = req.skillName || req.name || 'Required Skill';
    const studentSkill = studentSkillMap.get(reqSkillId);
    const studentLevel = studentSkill ? (studentSkill.level || 'Beginner') : 'None';

    // 1. Check directly tagged evidence
    const directlyTagged = studentEvidences.filter((e) => {
      const eSkillId = (e.skillId?._id || e.skillId?.id || e.skillId || '').toString();
      return eSkillId === reqSkillId && e.status === 'processed';
    });

    // 2. Search actual extracted text and EvidenceChunk content across all student evidences
    const contentMatchedEvidences = [];
    const skillTerms = [skillName.toLowerCase()];
    if (req.synonyms && Array.isArray(req.synonyms)) {
      req.synonyms.forEach(s => skillTerms.push(s.toLowerCase()));
    }

    // Search evidence chunks
    for (const ev of studentEvidences) {
      if (ev.status !== 'processed') continue;
      const evId = (ev.id || ev._id || '').toString();

      // Find chunks belonging to this evidence
      const chunks = evidenceChunks.filter(c => (c.evidenceId || '').toString() === evId);
      let foundSnippet = '';

      for (const chunk of chunks) {
        const chunkLower = (chunk.text || '').toLowerCase();
        for (const term of skillTerms) {
          const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(chunkLower)) {
            foundSnippet = chunk.text;
            break;
          }
        }
        if (foundSnippet) break;
      }

      // If no chunk match, check ev.extractedText
      if (!foundSnippet && ev.extractedText) {
        const textLower = ev.extractedText.toLowerCase();
        for (const term of skillTerms) {
          const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(textLower)) {
            // grab a 150-char window around the match
            const idx = textLower.indexOf(term);
            const start = Math.max(0, idx - 40);
            const end = Math.min(ev.extractedText.length, idx + 100);
            foundSnippet = ev.extractedText.substring(start, end).trim();
            break;
          }
        }
      }

      if (foundSnippet) {
        contentMatchedEvidences.push({
          evidenceId: evId,
          title: ev.title || ev.originalName,
          snippet: foundSnippet,
          confidence: 0.92
        });
      }
    }

    // Combine tagged and content-matched evidence (avoid duplicates)
    const combinedSupporting = [...contentMatchedEvidences];
    for (const tagged of directlyTagged) {
      const tId = (tagged.id || tagged._id || '').toString();
      if (!combinedSupporting.some(s => s.evidenceId === tId)) {
        combinedSupporting.push({
          evidenceId: tId,
          title: tagged.title || tagged.originalName,
          snippet: tagged.description || `Tagged in evidence metadata (${tagged.title})`,
          confidence: 0.70
        });
      }
    }

    const hasContentMatch = contentMatchedEvidences.length > 0;
    const hasTaggedEvidence = directlyTagged.length > 0;

    let status = 'gap';
    let reason = '';

    // FR-13: Grounding Rule - Do NOT mark matched solely on metadata tags without extracted content proof!
    if (studentSkill && hasContentMatch) {
      if (studentLevel === 'Advanced' || studentLevel === 'Intermediate') {
        status = 'matched';
        matchedCount++;
        reason = `Strong match: Recorded at ${studentLevel} level and substantiated by ${contentMatchedEvidences.length} verified evidence artifact(s) with extracted content proof.`;
      } else {
        status = 'partial';
        partialCount++;
        reason = `Partial match: Recorded at ${studentLevel} level with practical extracted content proof.`;
      }
    } else if (studentSkill && hasTaggedEvidence && !hasContentMatch) {
      // Tagged in metadata only, but keyword proof not found in extracted text
      status = 'partial';
      partialCount++;
      reason = `Unverified match: Skill is tagged in evidence metadata (${directlyTagged[0].title}), but explicit keyword proof was not found in extracted text.`;
    } else if (studentSkill && !hasContentMatch && !hasTaggedEvidence) {
      status = 'missing_evidence';
      missingCount++;
      reason = `Skill recorded at ${studentLevel} level, but no verified evidence file substantiates it. Upload proof to substantiate this competency.`;
    } else if (!studentSkill && hasContentMatch) {
      status = 'partial';
      partialCount++;
      reason = `Skill demonstrated in verified project artifacts (${contentMatchedEvidences[0].title}), but not explicitly tracked in student skill profile.`;
    } else {
      status = 'gap';
      gapCount++;
      reason = `Skill required by circular is missing from your recorded skills and no project artifacts prove it.`;
    }

    const itemId = crypto.randomBytes(12).toString('hex');
    gapItems.push({
      id: itemId,
      _id: itemId,
      skillId: reqSkillId,
      skillName,
      category: req.category || 'Technical',
      status,
      studentLevel,
      supportingEvidence: combinedSupporting,
      reason,
      isFlagged: false,
      flagReason: ''
    });
  }

  const totalRequired = requirements.length;
  const matchScore = totalRequired > 0
    ? Math.min(100, Math.round(((matchedCount * 1.0 + partialCount * 0.5) / totalRequired) * 100))
    : 0;

  const durationMs = Date.now() - startTime;

  return {
    matchScore,
    totalRequired,
    matchedCount,
    partialCount,
    missingCount,
    gapCount,
    items: gapItems,
    durationMs
  };
};

module.exports = {
  extractTextFromFile,
  chunkText,
  extractSkillsFromText,
  runGapAnalysis
};
