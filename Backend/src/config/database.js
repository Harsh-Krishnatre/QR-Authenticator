const mongoose = require('mongoose');
const colors = require('./colors');

// Track connection state for other modules
let isConnected = false;

const connectDB = async () => {
  try {
    // Use only supported connection options for modern mongo drivers
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('Database connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Database disconnected');
      isConnected = false;
    });

    // Graceful shutdown: close mongoose when app terminates
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('Database connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

    return true;

  } catch (error) {
    // Log raw error but do not exit; allow app to start in degraded mode
    console.error('Database connection raw error:', error);
    isConnected = false;
    return false;
  }
};

module.exports = connectDB;
module.exports.isConnected = () => isConnected;