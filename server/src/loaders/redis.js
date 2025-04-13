import Redis from 'ioredis';
import config from '../config/env.js';
import logger from '../utils/logger.js';

export default async () => {
  try {
    const redisClient = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DB,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Test connection
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis ping successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

