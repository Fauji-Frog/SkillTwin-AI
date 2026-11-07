const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const Skill = require('../src/models/Skill');
const StudentSkill = require('../src/models/StudentSkill');
const Evidence = require('../src/models/Evidence');
const JobCircular = require('../src/models/JobCircular');
const JobRequirement = require('../src/models/JobRequirement');
const SkillGapReport = require('../src/models/SkillGapReport');
const { readDb, writeDb, generateId } = require('../src/services/store');

const DEFAULT_SKILLS = [
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
  { name: 'Data Structures', category: 'Computer Science', synonyms: ['dsa', 'algorithms'] },
  { name: 'Teamwork', category: 'Soft Skill', synonyms: ['collaboration', 'communication'] },
  { name: 'Problem Solving', category: 'Soft Skill', synonyms: ['analytical thinking'] }
];

async function seed() {
  console.log('[Seed] Initializing seed data...');
  const db = readDb();

  // 1. Seed Skills Catalog
  db.skills = [];
  for (const s of DEFAULT_SKILLS) {
    const sid = generateId();
    db.skills.push({ ...s, id: sid, _id: sid, isActive: true });
  }

  // 2. Seed Demo Student: Sabiha Farin
  const demoEmail = 'sabiha.farin@university.edu';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  const userId = generateId();
  const profileId = generateId();

  db.users = [
    {
      id: userId,
      _id: userId,
      name: 'Sabiha Farin',
      email: demoEmail,
      passwordHash,
      role: 'student',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  db.profiles = [
    {
      id: profileId,
      _id: profileId,
      userId,
      studentId: '241-35-134',
      department: 'Computer Science & Engineering',
      batch: '42-B1',
      section: 'B1',
      careerInterests: ['Backend Engineering', 'Cloud & DevOps'],
      createdAt: new Date().toISOString()
    }
  ];

  // 3. Seed Recorded Skills (8 skills)
  const skillMap = {};
  db.skills.forEach((s) => {
    skillMap[s.name] = s.id;
  });

  const studentSkillsData = [
    { name: 'JavaScript', level: 'Advanced', note: 'Primary language for 3 semester projects' },
    { name: 'React', level: 'Intermediate', note: 'Built interactive dashboard SPA' },
    { name: 'Node.js', level: 'Advanced', note: 'Engineered REST APIs with Express and JWT' },
    { name: 'Express', level: 'Advanced', note: 'Middleware orchestration and rate limits' },
    { name: 'MongoDB', level: 'Intermediate', note: 'Aggregations and indexing schemas' },
    { name: 'REST API', level: 'Advanced', note: 'Clean API contract design and Postman tests' },
    { name: 'Git', level: 'Intermediate', note: 'Feature branches, PR reviews, merge workflows' },
    { name: 'Docker', level: 'Beginner', note: 'Basic containerization of backend services' }
  ];

  db.studentSkills = studentSkillsData.map((sk) => ({
    id: generateId(),
    _id: generateId(),
    studentProfileId: profileId,
    skillId: skillMap[sk.name],
    level: sk.level,
    levelSource: 'self',
    note: sk.note,
    createdAt: new Date().toISOString()
  }));

  // 4. Seed Processed Evidence (14 items)
  const evidenceSamples = [
    { skill: 'JavaScript', title: 'Algorithms_Lab_JS.pdf', desc: 'Implemented async event-loop simulation and complex closures for SE-211 lab.', ext: '.pdf', type: 'report' },
    { skill: 'JavaScript', title: 'DataFilter_Utility.js', desc: 'Authored functional filtering and mapping algorithms for dataset cleansing.', ext: '.js', type: 'code' },
    { skill: 'Node.js', title: 'Server_Architecture_Report.pdf', desc: 'Designed non-blocking asynchronous REST microservice handling 500 req/s.', ext: '.pdf', type: 'report' },
    { skill: 'Node.js', title: 'auth_controller.js', desc: 'Wrote bcrypt password hashing and HS256 JWT cookie signing routines.', ext: '.js', type: 'code' },
    { skill: 'Express', title: 'middleware_pipeline.js', desc: 'Structured helmet headers, rate limiter, and central error handling middleware.', ext: '.js', type: 'code' },
    { skill: 'Express', title: 'Express_Lab_Final.docx', desc: 'Final course project documentation detailing Express routing and request lifecycle.', ext: '.docx', type: 'report' },
    { skill: 'React', title: 'UI_Component_Library.jsx', desc: 'Created reusable responsive Tailwind cards, status chips, and navbar controls.', ext: '.jsx', type: 'code' },
    { skill: 'React', title: 'Frontend_Architecture.pdf', desc: 'Capstone frontend specification with state management and routing guards.', ext: '.pdf', type: 'report' },
    { skill: 'MongoDB', title: 'database_schema.js', desc: 'Defined Mongoose schemas with compound indexes and validation rules.', ext: '.js', type: 'code' },
    { skill: 'MongoDB', title: 'DB_Optimization_Lab.pdf', desc: 'Analyzed query execution plans using explain() and added indexes for 90% speedup.', ext: '.pdf', type: 'report' },
    { skill: 'REST API', title: 'API_Contract_Spec.json', desc: 'Comprehensive OpenAPI specification for student evidence endpoints.', ext: '.json', type: 'code' },
    { skill: 'REST API', title: 'Integration_Test_Suite.js', desc: 'Automated integration tests verifying response shapes and error status codes.', ext: '.js', type: 'code' },
    { skill: 'Git', title: 'Git_Workflow_Documentation.md', desc: 'Team branching strategy guide with semantic commit conventions.', ext: '.md', type: 'report' },
    { skill: 'Git', title: 'Pull_Request_Review_Log.pdf', desc: 'Code review history documenting 18 peer pull request approvals.', ext: '.pdf', type: 'report' }
  ];

  db.evidences = evidenceSamples.map((ev) => {
    const eid = generateId();
    return {
      id: eid,
      _id: eid,
      studentProfileId: profileId,
      skillId: skillMap[ev.skill],
      skillName: ev.skill,
      title: ev.title,
      description: ev.desc,
      evidenceType: ev.type,
      originalName: ev.title,
      storedName: `${Date.now()}-${ev.title}`,
      mimeType: ev.ext === '.pdf' ? 'application/pdf' : 'text/plain',
      sizeBytes: Math.floor(15000 + Math.random() * 45000),
      extension: ev.ext,
      status: 'processed',
      statusMessage: null,
      extractedText: `Verified student artifact: ${ev.desc} Key competencies validated: ${ev.skill} concepts, coding standards, and project contributions.`,
      chunkCount: 3,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  });

  // 5. Seed Job Circular & Skill-Gap Report
  const circId = generateId();
  db.jobCirculars = [
    {
      id: circId,
      _id: circId,
      studentProfileId: profileId,
      title: 'Backend Developer',
      company: 'TechCorp Solutions',
      rawText: 'Looking for a skilled Backend Developer proficient in Node.js, Express, REST API, MongoDB, JavaScript, Docker, and Git.',
      status: 'analyzed',
      createdAt: new Date().toISOString()
    }
  ];

  const reportId = generateId();
  db.reports = [
    {
      id: reportId,
      _id: reportId,
      studentProfileId: profileId,
      circularId: circId,
      jobTitle: 'Backend Developer',
      company: 'TechCorp Solutions',
      matchScore: 78,
      totalRequired: 7,
      matchedCount: 5,
      partialCount: 1,
      missingCount: 0,
      gapCount: 1,
      items: [
        {
          id: generateId(),
          skillName: 'Node.js',
          category: 'Backend',
          status: 'matched',
          studentLevel: 'Advanced',
          reason: 'Strong match: recorded at Advanced level and backed by 2 verified project artifacts.',
          supportingEvidence: [
            { title: 'Server_Architecture_Report.pdf', snippet: 'Designed non-blocking asynchronous REST microservice handling 500 req/s.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'Express',
          category: 'Backend',
          status: 'matched',
          studentLevel: 'Advanced',
          reason: 'Strong match: recorded at Advanced level with production-grade middleware implementation.',
          supportingEvidence: [
            { title: 'middleware_pipeline.js', snippet: 'Structured helmet headers, rate limiter, and central error handling middleware.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'REST API',
          category: 'Backend',
          status: 'matched',
          studentLevel: 'Advanced',
          reason: 'Strong match: recorded at Advanced level with complete contract design and tests.',
          supportingEvidence: [
            { title: 'API_Contract_Spec.json', snippet: 'Comprehensive OpenAPI specification for student evidence endpoints.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'JavaScript',
          category: 'Programming Language',
          status: 'matched',
          studentLevel: 'Advanced',
          reason: 'Strong match: demonstrated across lab reports and asynchronous algorithms.',
          supportingEvidence: [
            { title: 'Algorithms_Lab_JS.pdf', snippet: 'Implemented async event-loop simulation and complex closures for SE-211 lab.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'Git',
          category: 'DevOps & Tools',
          status: 'matched',
          studentLevel: 'Intermediate',
          reason: 'Matched: solid version control practices documented across pull requests.',
          supportingEvidence: [
            { title: 'Git_Workflow_Documentation.md', snippet: 'Team branching strategy guide with semantic commit conventions.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'MongoDB',
          category: 'Database',
          status: 'partial',
          studentLevel: 'Intermediate',
          reason: 'Partial match: recorded at Intermediate level with schema design and query profiling.',
          supportingEvidence: [
            { title: 'database_schema.js', snippet: 'Defined Mongoose schemas with compound indexes and validation rules.' }
          ]
        },
        {
          id: generateId(),
          skillName: 'Docker',
          category: 'DevOps & Tools',
          status: 'gap',
          studentLevel: 'Beginner',
          reason: 'Skill Gap: requires hands-on containerization and Dockerfile configuration with supporting evidence.',
          supportingEvidence: []
        }
      ],
      disclaimer: 'This report is an AI-generated guidance tool based on your uploaded evidence. It does not represent an official hiring or accreditation decision.',
      createdAt: new Date().toISOString()
    }
  ];

  writeDb(db);
  console.log('[Seed] Demo database fully seeded with Sabiha Farin account, 8 skills, 14 evidence items, and 1 active gap analysis!');
}

seed().catch(console.error);
