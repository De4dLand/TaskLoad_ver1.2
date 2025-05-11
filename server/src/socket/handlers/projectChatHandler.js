import mongoose from 'mongoose';
import ChatService from '../../services/chatService.js';

/**
 * Handles all project chat-related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 * @param {Map} onlineUsers - Map of online users (userId -> socketId)
 */
export default function projectChatHandler(io, socket, onlineUsers) {
  // Join a project chat room
  socket.on('project:join', async ({ projectId }) => {
    if (!projectId) return;
    
    const roomId = `project:${projectId}`;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined project room: ${roomId}`);
    
    // Notify others that user has joined
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.to(roomId).emit('project:userJoined', {
        userId,
        timestamp: new Date()
      });
    }
  });

  // Leave a project chat room
  socket.on('project:leave', ({ projectId }) => {
    if (!projectId) return;
    
    const roomId = `project:${projectId}`;
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left project room: ${roomId}`);
    
    // Notify others that user has left
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.to(roomId).emit('project:userLeft', {
        userId,
        timestamp: new Date()
      });
    }
  });

  // Send a message to a project chat room
  socket.on('chat:message', async (messageData) => {
    try {
      const { roomId, message, sender } = messageData;
      
      if (!roomId || !message || !sender) {
        socket.emit('chat:error', { error: 'Invalid message data' });
        return;
      }

      // Extract project ID from room ID (format: project:projectId)
      const projectId = roomId.startsWith('project:') ? roomId.split(':')[1] : null;
      if (!projectId) {
        socket.emit('chat:error', { error: 'Invalid project room ID' });
        return;
      }

      // Create chat room if it doesn't exist
      let chatRoom;
      try {
        // Try to find existing chat room for this project
        chatRoom = await ChatService.findChatByRoomId(roomId);
        
        if (!chatRoom) {
          // Create new project chat room
          chatRoom = await ChatService.createChatRoom({
            roomId,
            type: 'project',
            projectId: new mongoose.Types.ObjectId(projectId),
            participants: [], // Will be populated from project members
            messages: []
          });
        }
      } catch (err) {
        console.error('Error finding/creating chat room:', err);
        socket.emit('chat:error', { error: 'Failed to process message' });
        return;
      }

      // Save message to database
      try {
        await ChatService.saveMessage(roomId, message);
      } catch (err) {
        console.error('Error saving message:', err);
        // Continue anyway to broadcast the message
      }

      // Broadcast to everyone in the room
      io.to(roomId).emit('chat:message', message);
    } catch (error) {
      console.error('Error handling project chat message:', error);
      socket.emit('chat:error', { error: 'Failed to process message' });
    }
  });

  // Handle typing indicator
  socket.on('chat:typing', ({ roomId, userId, isTyping }) => {
    if (roomId && userId) {
      socket.to(roomId).emit('chat:typing', {
        userId,
        isTyping
      });
    }
  });
}