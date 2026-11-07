const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const skillRoutes = require('./routes/skillRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const jobCircularRoutes = require('./routes/jobCircularRoutes');
const reportRoutes = require('./routes/reportRoutes');
const statsRoutes = require('./routes/statsRoutes');
const learningPathRoutes = require('./routes/learningPathRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');

const app = express();

// Security headers (configure CSP to allow fonts and inline styles for preview)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS config allowing credentials from client origin
app.use(
  cors({
    origin: [env.CLIENT_ORIGIN || 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SkillTwin AI API Server is operational',
    timestamp: new Date().toISOString()
  });
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', skillRoutes);
app.use('/api', evidenceRoutes);
app.use('/api', jobCircularRoutes);
app.use('/api', reportRoutes);
app.use('/api', statsRoutes);
app.use('/api', learningPathRoutes);
app.use('/api', assessmentRoutes);

// Serve static frontend assets from client/dist if built
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Catch-all route to serve SPA index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
