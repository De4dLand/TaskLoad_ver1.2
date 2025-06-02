import Task from '../models/Task.js';
import NotificationService from './notificationService.js';
import { io } from '../server.js';
import mongoose from 'mongoose';

/**
 * Service for handling task change detection and notification generation
 */
class TaskChangeService {
  /**
   * Compare task data before and after update to generate appropriate notifications
   * @param {Object} oldTask - Task data before update
   * @param {Object} newTask - Task data after update
   * @returns {Promise<Object|null>} - Created notification or null if no notification needed
   */
  static async processTaskChange(oldTask, newTask) {
    try {
      if (!oldTask || !newTask) {
        console.error('Invalid task data for comparison');
        return null;
      }

      // Detect what has changed
      const changes = this.detectChanges(oldTask, newTask);
      
      // If nothing significant changed, don't create a notification
      if (Object.keys(changes).length === 0) {
        return null;
      }

      // Generate notification content based on changes
      const { content, type } = this.generateNotificationContent(changes, newTask);
      
      // Determine notification recipients
      const recipients = await this.determineRecipients(oldTask, newTask, changes);
      
      // Don't create notification if no recipients
      if (recipients.length === 0) {
        return null;
      }

      // Create notification metadata
      const metadata = {
        taskId: newTask._id,
        taskTitle: newTask.title,
        changes: changes,
        taskPriority: newTask.priority,
        taskStatus: newTask.status,
        dueDate: newTask.dueDate
      };

      // Create notification data
      const notificationData = {
        type: type,
        recipients: recipients,
        sender: newTask.updatedBy || newTask.createdBy,
        content: content,
        relatedProject: newTask.project,
        relatedTask: newTask._id,
        metadata: metadata
      };
      
      // Create notification
      const notification = await NotificationService.createNotification(notificationData);
      
      // Emit real-time notification via Socket.IO
      this.emitNotification(notification, recipients);
      
      return notification;
    } catch (error) {
      console.error('Error processing task change:', error);
      return null;
    }
  }

  /**
   * Detect changes between old and new task data
   * @param {Object} oldTask - Task data before update
   * @param {Object} newTask - Task data after update
   * @returns {Object} - Object containing detected changes
   */
  static detectChanges(oldTask, newTask) {
    const changes = {};
    
    // Check for status change
    if (oldTask.status !== newTask.status) {
      changes.status = {
        from: oldTask.status,
        to: newTask.status
      };
    }
    
    // Check for priority change
    if (oldTask.priority !== newTask.priority) {
      changes.priority = {
        from: oldTask.priority,
        to: newTask.priority
      };
    }
    
    // Check for due date change
    if (oldTask.dueDate?.toString() !== newTask.dueDate?.toString()) {
      changes.dueDate = {
        from: oldTask.dueDate,
        to: newTask.dueDate
      };
    }
    
    // Check for assignee change
    if (oldTask.assignedTo?.toString() !== newTask.assignedTo?.toString()) {
      changes.assignedTo = {
        from: oldTask.assignedTo,
        to: newTask.assignedTo
      };
    }
    
    // Check for title change
    if (oldTask.title !== newTask.title) {
      changes.title = {
        from: oldTask.title,
        to: newTask.title
      };
    }
    
    // Check for description change
    if (oldTask.description !== newTask.description) {
      changes.description = {
        changed: true
      };
    }
    
    return changes;
  }

  /**
   * Generate notification content based on detected changes
   * @param {Object} changes - Detected changes
   * @param {Object} task - Updated task data
   * @returns {Object} - Notification content and type
   */
  static generateNotificationContent(changes, task) {
    let content = '';
    let type = 'task';
    
    // Determine the most significant change for the notification
    if (changes.status && changes.status.to === 'completed') {
      content = `Task "${task.title}" has been marked as completed`;
      type = 'task';
    } else if (changes.assignedTo) {
      if (!changes.assignedTo.from && changes.assignedTo.to) {
        content = `Task "${task.title}" has been assigned to you`;
        type = 'task';
      } else if (changes.assignedTo.from && !changes.assignedTo.to) {
        content = `Task "${task.title}" is no longer assigned to you`;
        type = 'task';
      } else {
        content = `Task "${task.title}" has been reassigned`;
        type = 'task';
      }
    } else if (changes.dueDate) {
      content = `Due date for task "${task.title}" has been updated`;
      type = 'deadline';
    } else if (changes.priority) {
      content = `Priority for task "${task.title}" has changed to ${task.priority}`;
      type = 'task';
    } else if (changes.status) {
      content = `Task "${task.title}" status changed to ${task.status}`;
      type = 'task';
    } else if (changes.title) {
      content = `Task title has been updated to "${task.title}"`;
      type = 'task';
    } else if (changes.description) {
      content = `Description for task "${task.title}" has been updated`;
      type = 'task';
    } else {
      content = `Task "${task.title}" has been updated`;
      type = 'task';
    }
    
    return { content, type };
  }

  /**
   * Determine notification recipients based on task changes
   * @param {Object} oldTask - Task data before update
   * @param {Object} newTask - Task data after update
   * @param {Object} changes - Detected changes
   * @returns {Promise<Array>} - Array of recipient user IDs
   */
  static async determineRecipients(oldTask, newTask, changes) {
    const recipients = new Set();
    
    // Always notify current assignee if exists
    if (newTask.assignedTo) {
      recipients.add(newTask.assignedTo.toString());
    }
    
    // If assignee changed, notify previous assignee as well
    if (changes.assignedTo && changes.assignedTo.from) {
      recipients.add(changes.assignedTo.from.toString());
    }
    
    // Notify task creator
    if (newTask.createdBy) {
      recipients.add(newTask.createdBy.toString());
    }
    
    // Get project members if task is part of a project
    if (newTask.project) {
      try {
        const Project = mongoose.model('Project');
        const project = await Project.findById(newTask.project);
        
        if (project && project.members && project.members.length > 0) {
          project.members.forEach(member => {
            if (member.user) {
              recipients.add(member.user.toString());
            }
          });
        }
      } catch (error) {
        console.error('Error getting project members:', error);
      }
    }
    
    // Remove the user who made the update to avoid self-notification
    if (newTask.updatedBy) {
      recipients.delete(newTask.updatedBy.toString());
    }
    
    return Array.from(recipients);
  }

  /**
   * Emit real-time notification via Socket.IO
   * @param {Object} notification - Created notification
   * @param {Array} recipients - Recipient user IDs
   */
  static emitNotification(notification, recipients) {
    try {
      if (!notification) return;
      
      // Emit to task room
      if (notification.relatedTask) {
        io.to(`task:${notification.relatedTask}`).emit('notification:new', notification);
      }
      
      // Emit to project room
      if (notification.relatedProject) {
        io.to(`project:${notification.relatedProject}`).emit('notification:new', notification);
      }
      
      // Emit to individual recipients
      recipients.forEach(userId => {
        io.to(`user:${userId}`).emit('notification:new', notification);
      });
    } catch (error) {
      console.error('Error emitting notification:', error);
    }
  }
}

export default TaskChangeService;