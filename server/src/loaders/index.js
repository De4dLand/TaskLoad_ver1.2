import expressLoader from './express.js';
import mongooseLoader from './mongoose.js';
import redisLoader from './redis.js';
import logger from '../utils/logger.js';

export default async (app) => {
  try {
    // Initialize Express
    await expressLoader(app);
    logger.info('Express initialized');

    // Initialize MongoDB
    await mongooseLoader();
    logger.info('MongoDB initialized');

    // Initialize Redis
    const redisClient = await redisLoader();
    logger.info('Redis initialized');

    // Store redis client in app.locals for global access
    app.locals.redis = redisClient;

    logger.info('All loaders initialized successfully');
  } catch (error) {
    logger.error('Error initializing loaders:', error);
    process.exit(1);
  }
};

