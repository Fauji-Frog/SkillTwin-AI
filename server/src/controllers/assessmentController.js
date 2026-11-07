const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const AssessmentResult = require('../models/AssessmentResult');
const StudentSkill = require('../models/StudentSkill');
const Skill = require('../models/Skill');
const Evidence = require('../models/Evidence');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

const DEFAULT_ASSESSMENTS = [
  {
    skillName: 'JavaScript',
    title: 'JavaScript Core Principles Quiz',
    category: 'Programming Language',
    scoringRule: '1 point per question. Beginner <40%, Intermediate 40-74%, Advanced >=75%',
    questions: [
      {
        text: 'What will be logged by: console.log(typeof NaN);',
        options: ['number', 'NaN', 'undefined', 'object'],
        correctIndex: 0,
        explanation: 'In JavaScript, NaN (Not-a-Number) is formally of type number according to IEEE 754 specification.'
      },
      {
        text: 'Which queue handles Promise.then callbacks in the JavaScript event loop?',
        options: ['Macrotask queue', 'Microtask queue', 'Render queue', 'Call stack'],
        correctIndex: 1,
        explanation: 'Promise callbacks are scheduled on the microtask queue, which has higher priority than the macrotask queue.'
      },
      {
        text: 'What is the primary characteristic of a closure in JavaScript?',
        options: [
          'A function that has no parameters',
          'A function that retains access to its lexical scope even when executed outside that scope',
          'A function that executes immediately upon definition',
          'A function that cannot be reassigned'
        ],
        correctIndex: 1,
        explanation: 'A closure is the combination of a function and the lexical environment within which that function was declared.'
      },
      {
        text: 'How does Object.freeze() differ from Object.seal()?',
        options: [
          'Object.freeze makes properties read-only and prevents adding/deleting; Object.seal prevents adding/deleting but allows modifying existing writable properties',
          'They are identical',
          'Object.seal is permanent, Object.freeze can be undone',
          'Object.freeze only works on arrays'
        ],
        correctIndex: 0,
        explanation: 'Object.freeze prevents property modification, while Object.seal allows value mutation of existing writable properties.'
      },
      {
        text: 'What is the return value of Array.prototype.reduce when no initialValue is provided and the array is empty?',
        options: ['undefined', 'null', '0', 'TypeError is thrown'],
        correctIndex: 3,
        explanation: 'Calling reduce on an empty array with no initialValue throws a TypeError in JavaScript.'
      }
    ]
  },
  {
    skillName: 'Node.js',
    title: 'Node.js Asynchronous Runtime Assessment',
    category: 'Backend',
    scoringRule: '1 point per question. Beginner <40%, Intermediate 40-74%, Advanced >=75%',
    questions: [
      {
        text: 'Which library powers the asynchronous event loop and thread pool in Node.js?',
        options: ['V8 Engine', 'libuv', 'OpenSSL', 'npm'],
        correctIndex: 1,
        explanation: 'libuv is the multi-platform C library that handles the event loop and thread pool in Node.js.'
      },
      {
        text: 'What is the default size of the libuv worker thread pool in Node.js?',
        options: ['2 threads', '4 threads', '8 threads', 'Unlimited'],
        correctIndex: 1,
        explanation: 'By default, the libuv thread pool (UV_THREADPOOL_SIZE) defaults to 4 threads.'
      },
      {
        text: 'Which method should be used to protect express applications against known HTTP header vulnerabilities?',
        options: ['cors()', 'helmet()', 'cookie-parser()', 'morgan()'],
        correctIndex: 1,
        explanation: 'helmet sets sensible HTTP security headers such as X-Content-Type-Options, Strict-Transport-Security, etc.'
      },
      {
        text: 'What is the primary benefit of using Streams over fs.readFile for large files in Node.js?',
        options: [
          'Streams execute synchronously',
          'Streams process data chunk by chunk without buffering the entire file into memory',
          'Streams automatically compress files',
          'Streams disable CPU interrupts'
        ],
        correctIndex: 1,
        explanation: 'Streams maintain constant, low memory overhead by reading and piping chunk by chunk.'
      },
      {
        text: 'Where should unhandled promise rejections be trapped globally in a Node process?',
        options: [
          'process.on("unhandledRejection", ...)',
          'window.onerror',
          'try/catch in main',
          'console.error'
        ],
        correctIndex: 0,
        explanation: 'The process event "unhandledRejection" is the standard handler for untrapped promise rejections.'
      }
    ]
  },
  {
    skillName: 'React',
    title: 'React Components & State Management Quiz',
    category: 'Frontend',
    scoringRule: '1 point per question. Beginner <40%, Intermediate 40-74%, Advanced >=75%',
    questions: [
      {
        text: 'What is the purpose of the key prop in React lists?',
        options: [
          'To style list items',
          'To help React identify which items have changed, been added, or been removed during reconciliation',
          'To access index in CSS',
          'To trigger useEffect'
        ],
        correctIndex: 1,
        explanation: 'Keys provide stable identity across renders so React can efficiently reorder and diff DOM nodes.'
      },
      {
        text: 'What does the dependency array in useEffect([a, b]) signify?',
        options: [
          'The hook runs only once on mount',
          'The effect re-runs only if reference identity of "a" or "b" changes between renders',
          'The effect executes in parallel threads',
          'The dependencies are memoized functions'
        ],
        correctIndex: 1,
        explanation: 'React compares each dependency using Object.is; if any have changed, the effect re-runs.'
      },
      {
        text: 'When should you use useCallback instead of declaring an inline function?',
        options: [
          'For every single function in React',
          'When passing a callback to an optimized child component that relies on reference equality to prevent re-renders',
          'To run calculations asynchronously',
          'To replace Redux'
        ],
        correctIndex: 1,
        explanation: 'useCallback memoizes callback references, useful when passed to React.memo wrapped children.'
      },
      {
        text: 'What happens if you mutate state directly instead of calling setState / dispatch?',
        options: [
          'React throws a compilation error',
          'React does not know state has changed and fails to schedule a re-render',
          'The browser crashes',
          'The state is automatically cloned'
        ],
        correctIndex: 1,
        explanation: 'Direct mutations bypass React reconciliation cycle and will not trigger component updates.'
      },
      {
        text: 'What is the role of React.StrictMode?',
        options: [
          'Forces TypeScript validation',
          'Highlights potential problems, verifies side-effect purity by double-invoking lifecycle methods in development',
          'Minifies JavaScript bundles',
          'Disables developer tools'
        ],
        correctIndex: 1,
        explanation: 'StrictMode activates additional checks and warnings, including double-invoking component renders in dev.'
      }
    ]
  }
];

exports.getAssessments = async (req, res, next) => {
  try {
    if (!isMongoReady()) {
      const db = readDb();
      if (!db.assessments || db.assessments.length === 0) {
        db.assessments = DEFAULT_ASSESSMENTS.map((a) => ({
          ...a,
          id: generateId(),
          _id: generateId(),
          questions: a.questions.map((q) => ({ ...q, id: generateId(), _id: generateId() }))
        }));
        writeDb(db);
      }

      // Return list of assessments without questions or with stripped answers
      const list = db.assessments.map((a) => ({
        id: a.id || a._id,
        _id: a.id || a._id,
        skillName: a.skillName,
        title: a.title,
        category: a.category,
        questionCount: a.questions?.length || 0,
        scoringRule: a.scoringRule
      }));

      return res.status(200).json({ success: true, data: list });
    }

    let list = await Assessment.find().select('skillName title category scoringRule questions');
    if (list.length === 0) {
      await Assessment.insertMany(DEFAULT_ASSESSMENTS);
      list = await Assessment.find().select('skillName title category scoringRule questions');
    }

    const formatted = list.map((a) => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      skillName: a.skillName,
      title: a.title,
      category: a.category,
      questionCount: a.questions.length,
      scoringRule: a.scoringRule
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      const assessment = (db.assessments || []).find((a) => a.id === id || a._id === id);
      if (!assessment) {
        return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
      }

      // SECURITY CRITICAL: Strip correctIndex before sending to client!
      const sanitized = {
        id: assessment.id || assessment._id,
        skillName: assessment.skillName,
        title: assessment.title,
        category: assessment.category,
        scoringRule: assessment.scoringRule,
        questions: (assessment.questions || []).map((q, idx) => ({
          index: idx,
          text: q.text,
          options: q.options
        }))
      };

      return res.status(200).json({ success: true, data: sanitized });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    const sanitized = {
      id: assessment._id.toString(),
      skillName: assessment.skillName,
      title: assessment.title,
      category: assessment.category,
      scoringRule: assessment.scoringRule,
      questions: assessment.questions.map((q, idx) => ({
        index: idx,
        text: q.text,
        options: q.options
      }))
    };

    res.status(200).json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
};

exports.submitAssessment = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { id } = req.params;
    const { answers } = req.body; // array of selected indices: [0, 1, 1, 0, 3]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: { message: 'Answers array is required' } });
    }

    if (!isMongoReady()) {
      const db = readDb();
      const assessment = (db.assessments || []).find((a) => a.id === id || a._id === id);
      if (!assessment) {
        return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
      }

      let score = 0;
      const feedback = [];

      assessment.questions.forEach((q, idx) => {
        const isCorrect = answers[idx] === q.correctIndex;
        if (isCorrect) score += 1;
        feedback.push({
          questionIndex: idx,
          correct: isCorrect,
          explanation: q.explanation
        });
      });

      const maxScore = assessment.questions.length;
      const percent = Math.round((score / maxScore) * 100);

      // Level estimation rules per SRS: Beginner < 40%, Intermediate 40-74%, Advanced >= 75%
      let estimatedLevel = 'Beginner';
      if (percent >= 75) {
        estimatedLevel = 'Advanced';
      } else if (percent >= 40) {
        estimatedLevel = 'Intermediate';
      }

      // Check evidence support for this skill
      const skillInCatalog = (db.skills || []).find((s) => s.name.toLowerCase() === assessment.skillName.toLowerCase());
      const hasStrongEvidence = (db.evidences || []).some(
        (e) => e.studentProfileId === profileId && e.skillId === (skillInCatalog?.id || skillInCatalog?._id) && e.status === 'processed'
      );

      const levelBasis = hasStrongEvidence ? 'score+evidence' : 'score_only';

      const result = {
        id: generateId(),
        _id: generateId(),
        studentProfileId: profileId,
        assessmentId: id,
        skillName: assessment.skillName,
        score,
        maxScore,
        percent,
        estimatedLevel,
        levelBasis,
        feedback,
        takenAt: new Date().toISOString()
      };

      if (!db.assessmentResults) db.assessmentResults = [];
      db.assessmentResults.push(result);

      // Update student skills profile
      if (skillInCatalog) {
        let existingSS = (db.studentSkills || []).find(
          (ss) => ss.studentProfileId === profileId && ss.skillId === (skillInCatalog.id || skillInCatalog._id)
        );
        if (existingSS) {
          existingSS.level = estimatedLevel;
          existingSS.levelSource = 'estimated';
          existingSS.note = `Verified via Quiz (${score}/${maxScore}, ${percent}%)`;
        } else {
          db.studentSkills.push({
            id: generateId(),
            studentProfileId: profileId,
            skillId: skillInCatalog.id || skillInCatalog._id,
            level: estimatedLevel,
            levelSource: 'estimated',
            note: `Verified via Quiz (${score}/${maxScore}, ${percent}%)`,
            createdAt: new Date().toISOString()
          });
        }
      }

      writeDb(db);

      return res.status(200).json({ success: true, data: result });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: { message: 'Assessment not found' } });
    }

    let score = 0;
    const feedback = [];

    assessment.questions.forEach((q, idx) => {
      const isCorrect = answers[idx] === q.correctIndex;
      if (isCorrect) score += 1;
      feedback.push({
        questionIndex: idx,
        correct: isCorrect,
        explanation: q.explanation
      });
    });

    const maxScore = assessment.questions.length;
    const percent = Math.round((score / maxScore) * 100);

    let estimatedLevel = 'Beginner';
    if (percent >= 75) {
      estimatedLevel = 'Advanced';
    } else if (percent >= 40) {
      estimatedLevel = 'Intermediate';
    }

    const skill = await Skill.findOne({ name: assessment.skillName });
    const result = await AssessmentResult.create({
      studentProfileId: profileId,
      assessmentId: id,
      skillName: assessment.skillName,
      score,
      maxScore,
      percent,
      estimatedLevel,
      levelBasis: 'score_only',
      feedback
    });

    if (skill) {
      await StudentSkill.findOneAndUpdate(
        { studentProfileId: profileId, skillId: skill._id },
        {
          level: estimatedLevel,
          levelSource: 'estimated',
          note: `Verified via Quiz (${score}/${maxScore}, ${percent}%)`
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
