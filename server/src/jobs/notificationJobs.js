import NotificationService from '../services/notificationService.js';
import cron from 'node-cron';

/**
 * Initialize notification-related scheduled jobs
 */
export function initNotificationJobs() {
  // Run every hour to check for upcoming due dates
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running scheduled notification check for due dates');
      const notifications = await NotificationService.checkDueDateNotifications();
      console.log(`Created ${notifications.length} due date notifications`);
    } catch (error) {
      console.error('Error in notification scheduled job:', error);
    }
  });
}

export default initNotificationJobs;
