import ChatService from './chatService.js';
import NotificationService from './notificationService.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Service for handling task-specific chat operations
 */
class TaskChatService {
  /**
   * Create a chat room for a task if it doesn't exist
   * @param {Object} task - Task object
   * @returns {Promise<Object>} - Chat room
   */
  static async createOrGetTaskChatRoom(task) {
    try {
      // If task already has a chat room, return it
      if (task.chatRoomId) {
        const existingChat = await ChatService.getChatRoomById(task.chatRoomId);
        if (existingChat) {
          return existingChat;
        }
      }

      // Determine participants (task creator, assignee, and project members)
      const participants = [];
      
      // Add task creator
      if (task.createdBy) {
        participants.push(task.createdBy);
      }
      
      // Add task assignee if different from creator
      if (task.assignedTo && 
          task.assignedTo.toString() !== task.createdBy.toString() && 
          !participants.includes(task.assignedTo.toString())) {
        participants.push(task.assignedTo);
      }
      
      // Get project members if available
      if (task.project) {
        const project = await Project.findById(task.project);
        if (project && project.members && project.members.length > 0) {
          for (const member of project.members) {
            if (member.user && 
                !participants.includes(member.user.toString())) {
              participants.push(member.user);
            }
          }
        }
      }
      
      // Create a unique room ID for the task
      const roomId = `task_${task._id}_${Date.now()}`;
      
      // Create chat room
      const chatData = {
        roomId: roomId,
        type: 'task',
        participants: participants,
        taskId: task._id,
        projectId: task.project,
        messages: [],
        metadata: {
          taskTitle: task.title,
          taskStatus: task.status,
          taskPriority: task.priority
        }
      };
      
      const chatRoom = await ChatService.createChatRoom(chatData);
      
      // Update task with chat room ID
      await Task.findByIdAndUpdate(task._id, { chatRoomId: roomId });
      
      return chatRoom;
    } catch (error) {
      logger.error(`Error creating task chat room for task ${task._id}:`, error);
      throw error;
    }
  }
  
  /**
   * Send a message to a task chat room and notify participants
   * @param {string} taskId - Task ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Saved message
   */
  static async sendTaskChatMessage(taskId, messageData) {
    try {
      // Get task
      const task = await Task.findById(taskId)
        .populate('assignedTo')
        .populate('createdBy');
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Get or create chat room for task
      let chatRoom;
      if (task.chatRoomId) {
        chatRoom = await ChatService.getChatRoomById(task.chatRoomId);
      }
      
      if (!chatRoom) {
        chatRoom = await this.createOrGetTaskChatRoom(task);
      }
      
      // Save message to chat
      const savedMessage = await ChatService.saveMessage(chatRoom.roomId, messageData);
      
      // Create notifications for all participants except sender
      const recipients = chatRoom.participants.filter(
        participant => participant.toString() !== messageData.sender.toString()
      );
      
      if (recipients.length > 0) {
        // Get sender details
        const sender = await User.findById(messageData.sender);
        const senderName = sender ? 
          (sender.firstName && sender.lastName ? 
            `${sender.firstName} ${sender.lastName}` : 
            sender.username) : 
          'A team member';
        
        // Create notification
        await NotificationService.createCustomNotification(
          messageData.sender,
          task.project,
          `${senderName} commented on task: ${task.title}`,
          recipients,
          {
            type: 'task_chat',
            taskId: task._id,
            chatRoomId: chatRoom.roomId,
            messageId: messageData._id || messageData.id
          }
        );
      }
      
      return savedMessage;
    } catch (error) {
      logger.error(`Error sending task chat message for task ${taskId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get chat history for a task
   * @param {string} taskId - Task ID
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Object>} - Chat with messages
   */
  static async getTaskChatHistory(taskId, options = {}) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // If task doesn't have a chat room yet, create one
      if (!task.chatRoomId) {
        await this.createOrGetTaskChatRoom(task);
        // Refresh task to get the new chatRoomId
        const updatedTask = await Task.findById(taskId);
        if (!updatedTask.chatRoomId) {
          throw new Error(`Failed to create chat room for task: ${taskId}`);
        }
        return await ChatService.getChatHistory(updatedTask.chatRoomId, options);
      }
      
      return await ChatService.getChatHistory(task.chatRoomId, options);
    } catch (error) {
      logger.error(`Error getting task chat history for task ${taskId}:`, error);
      throw error;
    }
  }
  
  /**
   * Mark messages as read in a task chat
   * @param {string} roomId - Chat room ID
   * @param {Array<string>} messageIds - Array of message IDs to mark as read
   * @param {string} userId - User ID who read the messages
   * @returns {Promise<Object>} - Updated chat
   */
  static async markMessagesAsRead(roomId, messageIds, userId) {
    try {
      return await ChatService.markMessagesAsRead(roomId, messageIds, userId);
    } catch (error) {
      logger.error(`Error marking messages as read in chat room ${roomId}:`, error);
      throw error;
    }
  }
}

export default TaskChatService;
