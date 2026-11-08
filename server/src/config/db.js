const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`[Database] Connection Error: Could not connect to MongoDB at ${env.MONGODB_URI}: ${err.message}`);
    const allowFallback = process.env.ALLOW_JSON_FALLBACK === 'true' || process.env.NODE_ENV !== 'production';
    if (allowFallback) {
      console.warn(`[Database] Notice: Falling back to zero-config JSON database storage (server/data/db.json).`);
      process.env.DB_FALLBACK = 'true';
    } else {
      console.error(`[Database] Fatal: MongoDB connection required but unavailable (ALLOW_JSON_FALLBACK is not enabled).`);
      throw err;
    }
  }
}

module.exports = { connectDB, mongoose };
