import mongoose from 'mongoose';
import config from '../config/env.js';
import logger from '../utils/logger.js';

export default async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, config.MONGODB_OPTIONS);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB connection closure:', error);
      process.exit(1);
    }
  });
};