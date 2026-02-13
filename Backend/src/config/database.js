const mongoose = require('mongoose');
const settings = require('./settings');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(settings.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error('Database connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            logger.info('Database disconnected');
            isConnected = false;
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('Database connection closed through app termination');
                process.exit(0);
            } catch (err) {
                logger.error('Error during database disconnection:', err);
                process.exit(1);
            }
        });

        return true;
    } catch (error) {
        logger.error('Database connection raw error:', error);
        isConnected = false;
        return false;
    }
};

module.exports = connectDB;
module.exports.isConnected = () => isConnected;
