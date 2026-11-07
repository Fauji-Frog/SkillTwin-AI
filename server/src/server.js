const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[SkillTwin Server] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
    console.log(`[SkillTwin Server] Health check: http://localhost:${env.PORT}/api/health`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

startServer();
