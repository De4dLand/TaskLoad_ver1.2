import TaskChatService from '../../../services/taskChatService.js';
import Task from '../../../models/Task.js';

/**
 * Get chat history for a task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getTaskChatHistory = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Get chat history
    const chatHistory = await TaskChatService.getTaskChatHistory(taskId, { 
      limit: parseInt(limit), 
      skip: parseInt(skip) 
    });
    
    res.status(200).json({
      success: true,
      data: chatHistory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a task chat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const sendTaskChatMessage = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Create message data
    const messageData = {
      sender: userId,
      content,
      timestamp: new Date(),
      read: [userId] // Mark as read by sender
    };
    
    // Send message
    const result = await TaskChatService.sendTaskChatMessage(taskId, messageData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read in a task chat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs are required'
      });
    }
    
    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (!task.chatRoomId) {
      return res.status(404).json({
        success: false,
        message: 'Task chat room not found'
      });
    }
    
    // Mark messages as read
    await TaskChatService.markMessagesAsRead(task.chatRoomId, messageIds, userId);
    
    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getTaskChatHistory,
  sendTaskChatMessage,
  markMessagesAsRead
};
