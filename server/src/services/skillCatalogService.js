const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const { readDb, writeDb, generateId } = require('./store');

const isMongoReady = () =>
  mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

const FALLBACK_SKILLS = [
  { name: 'JavaScript', category: 'Programming Language', synonyms: ['js', 'ecmascript', 'es6'] },
  { name: 'TypeScript', category: 'Programming Language', synonyms: ['ts'] },
  { name: 'Python', category: 'Programming Language', synonyms: ['py', 'python3'] },
  { name: 'Java', category: 'Programming Language', synonyms: ['jvm'] },
  { name: 'React', category: 'Frontend', synonyms: ['reactjs', 'react.js'] },
  { name: 'Node.js', category: 'Backend', synonyms: ['node', 'nodejs'] },
  { name: 'Express', category: 'Backend', synonyms: ['expressjs', 'express.js'] },
  { name: 'REST API', category: 'Backend', synonyms: ['rest', 'restful', 'apis'] },
  { name: 'MongoDB', category: 'Database', synonyms: ['mongo', 'nosql', 'mongoose'] },
  { name: 'SQL', category: 'Database', synonyms: ['mysql', 'postgresql', 'postgres'] },
  { name: 'Git', category: 'DevOps & Tools', synonyms: ['github', 'version control', 'gitlab'] },
  { name: 'Docker', category: 'DevOps & Tools', synonyms: ['container', 'dockerfile'] },
  { name: 'Tailwind CSS', category: 'Frontend', synonyms: ['tailwind', 'css framework'] },
  { name: 'Data Structures', category: 'Concepts', synonyms: ['dsa', 'algorithms'] },
  { name: 'Teamwork', category: 'Soft Skill', synonyms: ['collaboration', 'communication'] },
  { name: 'Problem Solving', category: 'Soft Skill', synonyms: ['analytical thinking'] }
];

function loadSeedSkills() {
  try {
    const seedPath = path.resolve(__dirname, '../../seed/skills.json');
    if (fs.existsSync(seedPath)) {
      const parsed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Skills] Failed to read seed/skills.json, using fallback catalog:', err.message);
  }
  return FALLBACK_SKILLS;
}

/**
 * Ensures the skill catalog has default skills populated if currently empty.
 * Never deletes or overwrites existing skills or user data.
 */
async function ensureSkillsCatalog() {
  const seedList = loadSeedSkills();

  if (!isMongoReady()) {
    const db = readDb();
    if (!Array.isArray(db.skills) || db.skills.length === 0) {
      db.skills = seedList.map((s) => {
        const sid = generateId();
        return {
          id: sid,
          _id: sid,
          name: s.name,
          category: s.category || 'Technical',
          synonyms: Array.isArray(s.synonyms) ? s.synonyms : [],
          isActive: true
        };
      });
      writeDb(db);
    }
    return;
  }

  const count = await Skill.countDocuments();
  if (count === 0) {
    for (const s of seedList) {
      await Skill.updateOne(
        { name: s.name },
        {
          $setOnInsert: {
            name: s.name,
            category: s.category || 'Technical',
            synonyms: Array.isArray(s.synonyms) ? s.synonyms : [],
            isActive: true
          }
        },
        { upsert: true }
      );
    }
  }
}

/**
 * Resolves an existing skill by ID or name, or creates a new custom skill if provided.
 */
async function resolveOrCreateSkill({ skillId, skillName, category = 'Custom' }) {
  await ensureSkillsCatalog();

  const trimmedId = typeof skillId === 'string' && skillId !== '__custom__' ? skillId.trim() : '';
  const trimmedName = typeof skillName === 'string' ? skillName.trim() : '';

  if (!trimmedId && !trimmedName) {
    return null;
  }

  if (!isMongoReady()) {
    const db = readDb();
    if (!Array.isArray(db.skills)) db.skills = [];

    if (trimmedId) {
      const byId = db.skills.find((s) => s.id === trimmedId || s._id === trimmedId);
      if (byId) {
        return {
          id: byId.id || byId._id,
          name: byId.name,
          category: byId.category,
          skill: byId,
          created: false
        };
      }
    }

    if (trimmedName) {
      const normalized = trimmedName.toLowerCase();
      const byName = db.skills.find((s) => (s.name || '').toLowerCase() === normalized);
      if (byName) {
        return {
          id: byName.id || byName._id,
          name: byName.name,
          category: byName.category,
          skill: byName,
          created: false
        };
      }

      const sid = generateId();
      const newSkill = {
        id: sid,
        _id: sid,
        name: trimmedName,
        category: (category && category.trim()) || 'Custom',
        synonyms: [],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      db.skills.push(newSkill);
      writeDb(db);

      return {
        id: sid,
        name: newSkill.name,
        category: newSkill.category,
        skill: newSkill,
        created: true
      };
    }

    return null;
  }

  // MongoDB mode
  if (trimmedId && mongoose.Types.ObjectId.isValid(trimmedId)) {
    const byId = await Skill.findById(trimmedId);
    if (byId) {
      return {
        id: byId._id.toString(),
        name: byId.name,
        category: byId.category,
        skill: byId,
        created: false
      };
    }
  }

  if (trimmedName) {
    const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const byName = await Skill.findOne({ name: new RegExp(`^${escaped}$`, 'i') });
    if (byName) {
      return {
        id: byName._id.toString(),
        name: byName.name,
        category: byName.category,
        skill: byName,
        created: false
      };
    }

    const createdSkill = await Skill.create({
      name: trimmedName,
      category: (category && category.trim()) || 'Custom',
      synonyms: [],
      isActive: true
    });

    return {
      id: createdSkill._id.toString(),
      name: createdSkill.name,
      category: createdSkill.category,
      skill: createdSkill,
      created: true
    };
  }

  return null;
}

module.exports = {
  ensureSkillsCatalog,
  resolveOrCreateSkill
};
