import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

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
  
  /**
   * Auto-create notification when a task is created
   * @param {Object} task - The newly created task
   * @returns {Promise<Object>} - Created notification
   */
  static async createTaskNotification(task) {
    try {
      // Get project and assignee details
      const project = await Project.findById(task.project);
      
      // Determine recipients
      const recipients = [];
      
      // Add task assignee if exists
      if (task.assignedTo) {
        recipients.push(task.assignedTo);
      }
      
      // Add project members if they exist
      if (project && project.members && project.members.length > 0) {
        project.members.forEach(member => {
          if (member.user && !recipients.includes(member.user.toString())) {
            recipients.push(member.user);
          }
        });
      }
      
      // Don't create notification if no recipients
      if (recipients.length === 0) {
        return null;
      }
      
      // Create notification data
      const notificationData = {
        type: 'task',
        recipients: recipients,
        sender: task.createdBy,
        content: `New task created: ${task.title}`,
        relatedProject: task.project,
        relatedTask: task._id,
        metadata: {
          taskPriority: task.priority,
          taskStatus: task.status,
          dueDate: task.dueDate
        }
      };
      
      return await this.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating task notification:', error);
      throw error;
    }
  }
  
  /**
   * Check for upcoming due dates and send notifications
   * @returns {Promise<Array>} - Array of created notifications
   */
  static async checkDueDateNotifications() {
    try {
      const now = new Date();
      const twoDaysFromNow = new Date(now);
      twoDaysFromNow.setDate(now.getDate() + 2);
      
      // Get tasks due within the next 2 days that don't have notifications yet
      const upcomingTasks = await Task.find({
        dueDate: { $gte: now, $lte: twoDaysFromNow },
        status: { $nin: ['completed', 'cancelled'] }
      }).populate('assignedTo').populate('createdBy').populate('project');
      
      const notifications = [];
      
      for (const task of upcomingTasks) {
        // Skip if no assignee
        if (!task.assignedTo) continue;
        
        // Calculate hours until due
        const hoursUntilDue = Math.round((task.dueDate - now) / (1000 * 60 * 60));
        
        // Determine notification content based on time remaining
        let content;
        if (hoursUntilDue <= 2) {
          content = `URGENT: Task "${task.title}" is due in less than 2 hours!`;
        } else if (hoursUntilDue <= 24) {
          content = `Reminder: Task "${task.title}" is due tomorrow!`;
        } else {
          content = `Upcoming: Task "${task.title}" is due in ${Math.round(hoursUntilDue/24)} days.`;
        }
        
        // Check if a similar notification already exists for this task and user within the last 12 hours
        const existingNotification = await Notification.findOne({
          relatedTask: task._id,
          recipients: task.assignedTo._id,
          createdAt: { $gte: new Date(now - 12 * 60 * 60 * 1000) }
        });
        
        if (existingNotification) continue;
        
        // Create notification
        const notificationData = {
          type: 'deadline',
          recipients: [task.assignedTo._id],
          content: content,
          relatedProject: task.project ? task.project._id : null,
          relatedTask: task._id,
          metadata: {
            taskPriority: task.priority,
            taskStatus: task.status,
            dueDate: task.dueDate,
            hoursRemaining: hoursUntilDue
          }
        };
        
        const notification = await this.createNotification(notificationData);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error checking due date notifications:', error);
      throw error;
    }
  }
  
  /**
   * Create a custom notification from a user to project members
   * @param {string} senderId - User ID of the sender
   * @param {string} projectId - Project ID
   * @param {string} content - Notification content
   * @param {Array} recipientIds - Optional specific recipient IDs (if empty, sends to all project members)
   * @param {Object} metadata - Optional additional data
   * @returns {Promise<Object>} - Created notification
   */
  static async createCustomNotification(senderId, projectId, content, recipientIds = [], metadata = {}) {
    try {
      let recipients = [];
      
      // If specific recipients are provided, use them
      if (recipientIds && recipientIds.length > 0) {
        recipients = recipientIds;
      } else if (projectId) {
        // Otherwise get all project members
        const project = await Project.findById(projectId);
        if (project && project.members) {
          recipients = project.members.map(member => member.user.toString());
          
          // Remove sender from recipients to avoid self-notification
          recipients = recipients.filter(id => id !== senderId.toString());
        }
      }
      
      // Don't create notification if no recipients
      if (recipients.length === 0) {
        return null;
      }
      
      const notificationData = {
        type: 'system',
        recipients: recipients,
        sender: senderId,
        content: content,
        relatedProject: projectId,
        metadata: metadata
      };
      
      return await this.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating custom notification:', error);
      throw error;
    }
  }
}

export default NotificationService;