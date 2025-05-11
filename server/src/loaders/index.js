import expressLoader from './express.js';
import mongooseLoader from './mongoose.js';
import redisLoader from './redis.js';
import socketLoader from './socket.js';
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
    
    // Socket.IO will be initialized after HTTP server is created
    // We'll store the initialization function for later use
    app.locals.initializeSocketIO = socketLoader;

    logger.info('All loaders initialized successfully');
  } catch (error) {
    logger.error('Error initializing loaders:', error);
    process.exit(1);
  }
};

// Export the socket loader for direct access if needed
export { socketLoader };

