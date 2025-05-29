import mongoose from 'mongoose';
import TaskChatService from '../../services/taskChatService.js';
import logger from '../../utils/logger.js';

/**
 * Handles all task chat-related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 * @param {Map} onlineUsers - Map of online users (userId -> socketId)
 */
export default function taskChatHandler(io, socket, onlineUsers) {
  // Join a task chat room
  socket.on('taskChat:join', async ({ taskId }) => {
    try {
      if (!taskId) {
        socket.emit('taskChat:error', { error: 'Task ID is required' });
        return;
      }
      
      // Get or create chat room for task
      const chat = await TaskChatService.getTaskChatHistory(taskId);
      
      if (chat && chat.roomId) {
        socket.join(`chat:${chat.roomId}`);
        logger.info(`Socket ${socket.id} joined task chat room: ${chat.roomId} for task: ${taskId}`);
        
        // Send chat history to the client
        socket.emit('taskChat:history', chat);
      } else {
        socket.emit('taskChat:error', { error: 'Failed to join task chat room' });
      }
    } catch (error) {
      logger.error(`Error joining task chat room for task ${taskId}:`, error);
      socket.emit('taskChat:error', { error: 'Failed to join task chat room' });
    }
  });

  // Leave a task chat room
  socket.on('taskChat:leave', ({ taskId, roomId }) => {
    if (roomId) {
      socket.leave(`chat:${roomId}`);
      logger.info(`Socket ${socket.id} left task chat room: ${roomId} for task: ${taskId}`);
    }
  });

  // Send a message to a task chat room
  socket.on('taskChat:message', async (messageData) => {
    try {
      const { taskId, content, sender, timestamp = new Date() } = messageData;
      
      if (!taskId || !content || !sender) {
        socket.emit('taskChat:error', { error: 'Invalid message data' });
        return;
      }

      // Create message object
      const chatMessage = {
        _id: new mongoose.Types.ObjectId(),
        content,
        sender,
        timestamp,
        read: [sender] // Mark as read by sender
      };

      // Save message and send notifications
      const result = await TaskChatService.sendTaskChatMessage(taskId, chatMessage);
      
      if (result && result.roomId) {
        // Message was saved successfully, broadcast to everyone in the room
        io.to(`chat:${result.roomId}`).emit('taskChat:message', {
          ...chatMessage,
          taskId,
          roomId: result.roomId
        });
        
        logger.info(`Message sent to task chat room ${result.roomId} for task ${taskId}`);
      }
    } catch (error) {
      logger.error('Error handling task chat message:', error);
      socket.emit('taskChat:error', { error: 'Failed to process message' });
    }
  });

  // Mark messages as read
  socket.on('taskChat:markRead', async ({ taskId, messageIds, userId }) => {
    try {
      if (!taskId || !messageIds || !userId) {
        socket.emit('taskChat:error', { error: 'Invalid read receipt data' });
        return;
      }
      
      // Get task chat room
      const task = await mongoose.model('Task').findById(taskId);
      if (!task || !task.chatRoomId) {
        socket.emit('taskChat:error', { error: 'Task chat room not found' });
        return;
      }
      
      // Mark messages as read
      await mongoose.model('Chat').updateOne(
        { roomId: task.chatRoomId, 'messages._id': { $in: messageIds } },
        { $addToSet: { 'messages.$[elem].read': userId } },
        { arrayFilters: [{ '_id': { $in: messageIds } }] }
      );

      // Notify other users in the room about read status
      socket.to(`chat:${task.chatRoomId}`).emit('taskChat:messageRead', {
        taskId,
        roomId: task.chatRoomId,
        messageIds,
        userId
      });
      
      logger.info(`Messages marked as read in task chat ${task.chatRoomId} for task ${taskId}`);
    } catch (error) {
      logger.error('Error marking task chat messages as read:', error);
      socket.emit('taskChat:error', { error: 'Failed to update read status' });
    }
  });

  // Handle typing indicator
  socket.on('taskChat:typing', async ({ taskId, userId, isTyping }) => {
    try {
      if (!taskId || !userId) {
        return;
      }
      
      // Get task chat room
      const task = await mongoose.model('Task').findById(taskId);
      if (!task || !task.chatRoomId) {
        return;
      }
      
      // Broadcast typing status to other users in the room
      socket.to(`chat:${task.chatRoomId}`).emit('taskChat:typing', {
        taskId,
        roomId: task.chatRoomId,
        userId,
        isTyping
      });
    } catch (error) {
      logger.error('Error handling task chat typing indicator:', error);
    }
  });
}
