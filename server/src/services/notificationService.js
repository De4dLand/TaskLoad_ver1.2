import Notification from '../models/Notification.js';

/**
 * Service for handling notification-related operations
 */
class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read by a user
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated notification
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error(`Notification not found: ${notificationId}`);
      }

      // Add user to read array if not already there
      if (!notification.read.includes(userId)) {
        notification.read.push(userId);
        return await notification.save();
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of update operation
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipients: userId, read: { $ne: userId } },
        { $addToSet: { read: userId } }
      );
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>} - Array of unread notifications
   */
  static async getUnreadNotifications(userId, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;
      
      return await Notification.find({
        recipients: userId,
        read: { $ne: userId }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username firstName lastName profileImage')
        .exec();
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of unread notifications
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        recipients: userId,
        read: { $ne: userId }
      });
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>} - Array of notifications
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, skip = 0 } = options;
      
      return await Notification.find({ recipients: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username firstName lastName profileImage')
        .exec();
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Result of delete operation
   */
  static async deleteNotification(notificationId) {
    try {
      return await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default NotificationService;