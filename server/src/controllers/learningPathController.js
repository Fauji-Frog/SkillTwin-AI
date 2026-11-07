const mongoose = require('mongoose');
const LearningPath = require('../models/LearningPath');
const SkillGapReport = require('../models/SkillGapReport');
const { readDb, writeDb, generateId } = require('../services/store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

// High quality verified educational resources and practice tasks
const RESOURCE_CATALOG = {
  Docker: {
    title: 'Docker & Container Fundamentals',
    description: 'Learn container virtualization, image construction, and multi-container composition.',
    url: 'https://docs.docker.com/get-started/',
    practiceTask: 'Author a multi-stage Dockerfile for an Express/Node.js application and run it with docker-compose.'
  },
  'Node.js': {
    title: 'Node.js Backend Architecture Guide',
    description: 'Master non-blocking asynchronous I/O, streams, and cluster scaling in Node.js runtime.',
    url: 'https://nodejs.org/docs/latest/api/',
    practiceTask: 'Build an authenticated REST microservice with cluster worker failover and health monitoring.'
  },
  React: {
    title: 'Modern React Architecture & Hooks',
    description: 'Deep dive into state immutability, effect dependency lifecycles, and custom hooks design.',
    url: 'https://react.dev/learn',
    practiceTask: 'Develop a responsive compound component library with context state and keyboard accessibility.'
  },
  MongoDB: {
    title: 'MongoDB Query Optimization & Indexing',
    description: 'Study compound B-tree index structures, aggregation pipelines, and schema normalization.',
    url: 'https://www.mongodb.com/docs/manual/',
    practiceTask: 'Profile slow queries using explain("executionStats") and build a 4-stage aggregation pipeline.'
  },
  'REST API': {
    title: 'RESTful API Design Standards',
    description: 'Best practices for HTTP methods, RFC-7807 error responses, idempotency, and versioning.',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
    practiceTask: 'Write an OpenAPI 3.0 YAML specification document and mock tests for an e-commerce order endpoint.'
  },
  Git: {
    title: 'Pro Git — Branching & Merge Workflows',
    description: 'Learn interactive rebasing, merge conflict resolution, cherry-picking, and conventional commits.',
    url: 'https://git-scm.com/book/en/v2',
    practiceTask: 'Simulate a 3-way merge conflict on a feature branch, resolve it cleanly, and rebase onto main.'
  },
  JavaScript: {
    title: 'JavaScript In-Depth — Async & Memory',
    description: 'Understand the JS event loop, microtask queues, closure memory leaks, and prototype chains.',
    url: 'https://javascript.info/',
    practiceTask: 'Implement a promise-based retry queue with exponential backoff and cancellation tokens.'
  },
  SQL: {
    title: 'Relational Database Design & SQL Profiling',
    description: 'Master ACID transactions, subqueries, CTEs, window functions, and foreign key constraints.',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    practiceTask: 'Write a CTE recursive query to traverse hierarchical category trees with aggregated child counts.'
  }
};

exports.getOrGeneratePath = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { reportId } = req.params;

    if (!isMongoReady()) {
      const db = readDb();
      let pathObj = (db.learningPaths || []).find((p) => p.reportId === reportId && p.studentProfileId === profileId);

      if (!pathObj) {
        const report = (db.reports || []).find((r) => r.id === reportId || r._id === reportId);
        if (!report) {
          return res.status(404).json({ success: false, error: { message: 'Report not found' } });
        }

        // Order: gap (priority 1) -> missing_evidence (priority 2) -> partial (priority 3)
        const sortedItems = [...(report.items || [])].sort((a, b) => {
          const rank = { gap: 1, missing_evidence: 2, partial: 3, matched: 4 };
          return (rank[a.status] || 5) - (rank[b.status] || 5);
        });

        const steps = sortedItems
          .filter((it) => it.status !== 'matched')
          .map((it) => {
            const fallbackInfo = RESOURCE_CATALOG[it.skillName] || {
              title: `${it.skillName} Technical Mastery`,
              description: `Structured curriculum and hands-on exercises for ${it.skillName}.`,
              url: 'https://developer.mozilla.org',
              practiceTask: `Implement a sample project demonstrating ${it.skillName} best practices.`
            };

            return {
              id: generateId(),
              skillName: it.skillName,
              title: fallbackInfo.title,
              description: fallbackInfo.description,
              url: fallbackInfo.url,
              level: it.studentLevel === 'None' ? 'Beginner' : it.studentLevel,
              practiceTask: fallbackInfo.practiceTask,
              status: 'todo',
              gapType: it.status
            };
          });

        pathObj = {
          id: generateId(),
          _id: generateId(),
          studentProfileId: profileId,
          reportId,
          jobTitle: report.jobTitle,
          steps,
          completedSteps: 0,
          totalSteps: steps.length,
          createdAt: new Date().toISOString()
        };

        if (!db.learningPaths) db.learningPaths = [];
        db.learningPaths.push(pathObj);
        writeDb(db);
      }

      return res.status(200).json({ success: true, data: pathObj });
    }

    let learningPath = await LearningPath.findOne({ reportId, studentProfileId: profileId });

    if (!learningPath) {
      const report = await SkillGapReport.findById(reportId);
      if (!report) {
        return res.status(404).json({ success: false, error: { message: 'Report not found' } });
      }

      const sortedItems = [...report.items].sort((a, b) => {
        const rank = { gap: 1, missing_evidence: 2, partial: 3, matched: 4 };
        return (rank[a.status] || 5) - (rank[b.status] || 5);
      });

      const steps = sortedItems
        .filter((it) => it.status !== 'matched')
        .map((it) => {
          const fallbackInfo = RESOURCE_CATALOG[it.skillName] || {
            title: `${it.skillName} Technical Mastery`,
            description: `Structured curriculum and hands-on exercises for ${it.skillName}.`,
            url: 'https://developer.mozilla.org',
            practiceTask: `Implement a sample project demonstrating ${it.skillName} best practices.`
          };

          return {
            skillName: it.skillName,
            title: fallbackInfo.title,
            description: fallbackInfo.description,
            url: fallbackInfo.url,
            level: it.studentLevel === 'None' ? 'Beginner' : it.studentLevel,
            practiceTask: fallbackInfo.practiceTask,
            status: 'todo',
            gapType: it.status
          };
        });

      learningPath = await LearningPath.create({
        studentProfileId: profileId,
        reportId,
        jobTitle: report.jobTitle,
        steps,
        completedSteps: 0,
        totalSteps: steps.length
      });
    }

    res.status(200).json({ success: true, data: learningPath });
  } catch (err) {
    next(err);
  }
};

exports.updateStepStatus = async (req, res, next) => {
  try {
    const profileId = req.user.profileId;
    const { pathId, stepId } = req.params;
    const { status } = req.body;

    if (!['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    }

    if (!isMongoReady()) {
      const db = readDb();
      const p = (db.learningPaths || []).find((item) => (item.id === pathId || item._id === pathId) && item.studentProfileId === profileId);
      if (!p) {
        return res.status(404).json({ success: false, error: { message: 'Path not found' } });
      }

      const step = (p.steps || []).find((s) => s.id === stepId || s._id === stepId);
      if (step) {
        step.status = status;
        p.completedSteps = p.steps.filter((s) => s.status === 'done').length;
        writeDb(db);
      }
      return res.status(200).json({ success: true, data: p });
    }

    const learningPath = await LearningPath.findOne({ _id: pathId, studentProfileId: profileId });
    if (!learningPath) {
      return res.status(404).json({ success: false, error: { message: 'Path not found' } });
    }

    const step = learningPath.steps.id(stepId);
    if (step) {
      step.status = status;
      learningPath.completedSteps = learningPath.steps.filter((s) => s.status === 'done').length;
      await learningPath.save();
    }

    res.status(200).json({ success: true, data: learningPath });
  } catch (err) {
    next(err);
  }
};
