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
    console.warn(`[Database] Warning: Could not connect to MongoDB at ${env.MONGODB_URI}: ${err.message}`);
    console.warn(`[Database] If MongoDB is not running locally, start mongod or set MONGODB_URI to an Atlas connection string.`);
    // Fallback store flag for local development if MongoDB is absent
    process.env.DB_FALLBACK = 'true';
  }
}

module.exports = { connectDB, mongoose };
