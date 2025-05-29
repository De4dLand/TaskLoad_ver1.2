import { initNotificationJobs } from '../jobs/notificationJobs.js';
import logger from '../utils/logger.js';

/**
 * Initialize notification jobs and related services
 */
export default async () => {
  try {
    // Initialize scheduled notification jobs
    initNotificationJobs();
    logger.info('Notification jobs initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing notification jobs:', error);
    throw error;
  }
};
