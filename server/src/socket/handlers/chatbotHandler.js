import Chat from '../../models/Chat.js';
import mongoose from 'mongoose';
import ChatService from '../../services/chatService.js';
import AIChatService from '../../services/aiChatService.js';
import logger from '../../utils/logger.js';

/**
 * Handles all chatbot-related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 * @param {Map} onlineUsers - Map of online users (userId -> socketId)
 */
export default function chatbotHandler(io, socket, onlineUsers) {
  // Join a chatbot room
  socket.on('chatbot:join', ({ roomId, userId }) => {
    if (roomId) {
      socket.join(`chatbot:${roomId}`);
      console.log(`User ${userId} joined chatbot room: ${roomId}`);
      
      // Notify other users in the room that this user has joined
      socket.to(`chatbot:${roomId}`).emit('chatbot:userJoined', { userId, roomId });
    }
  });

  // Leave a chatbot room
  socket.on('chatbot:leave', ({ roomId, userId }) => {
    if (roomId) {
      socket.leave(`chatbot:${roomId}`);
      console.log(`User ${userId} left chatbot room: ${roomId}`);
      
      // Notify other users in the room that this user has left
      socket.to(`chatbot:${roomId}`).emit('chatbot:userLeft', { userId, roomId });
    }
  });

  // Send a message to a chatbot room
  socket.on('chatbot:message', async (messageData) => {
    try {
      const { roomId, content, sender, timestamp = new Date() } = messageData;
      
      if (!roomId || !content || !sender) {
        socket.emit('chatbot:error', { error: 'Invalid message data' });
        return;
      }

      // Find the chat room
      const chatRoom = await Chat.findOne({ roomId });
      
      if (!chatRoom) {
        socket.emit('chatbot:error', { error: 'Chat room not found' });
        return;
      }

      // Create message object
      const message = {
        sender,
        content,
        timestamp,
        read: [sender] // Mark as read by sender
      };

      // Check if this is an AI-directed message
      const isAIMessage = AIChatService.isMessageForAI(content);
      
      if (isAIMessage) {
        logger.debug(`AI message detected in room ${roomId} from user ${sender}`);
        
        // Emit typing indicator for AI
        io.to(`chatbot:${roomId}`).emit('chatbot:typing', {
          roomId,
          userId: 'ai-assistant',
          isTyping: true
        });
      }
      
      // Save message using ChatService which handles AI processing
      await ChatService.saveMessage(roomId, message);
      
      // Broadcast to everyone in the room
      io.to(`chatbot:${roomId}`).emit('chatbot:message', {
        ...message,
        _id: message._id,
        roomId
      });
      
      // If this was an AI message, the AI response will be automatically
      // generated and broadcast through the regular chat channels

      // Send notifications to offline participants
      const offlineParticipants = chatRoom.participants.filter(participantId => {
        // Check if participant is not the sender and is offline
        return participantId.toString() !== sender.toString() && 
               !onlineUsers.has(participantId.toString());
      });

      // Store notifications for offline users (could be implemented with a notification service)
      if (offlineParticipants.length > 0) {
        // This would typically call a notification service
        console.log(`Storing notifications for offline users: ${offlineParticipants.join(', ')}`);
      }
    } catch (error) {
      console.error('Error handling chatbot message:', error);
      socket.emit('chatbot:error', { error: 'Failed to process message' });
    }
  });

  // Handle typing indicator
  socket.on('chatbot:typing', ({ roomId, userId, isTyping }) => {
    if (roomId && userId) {
      socket.to(`chatbot:${roomId}`).emit('chatbot:typing', {
        roomId,
        userId,
        isTyping
      });
    }
  });

  // Mark messages as read
  socket.on('chatbot:markRead', async ({ roomId, messageIds, userId }) => {
    try {
      if (!roomId || !messageIds || !userId) {
        socket.emit('chatbot:error', { error: 'Invalid read receipt data' });
        return;
      }

      // Update messages in database
      const chatRoom = await Chat.findOne({ roomId });
      if (!chatRoom) {
        socket.emit('chatbot:error', { error: 'Chat room not found' });
        return;
      }

      // Update read status for each message
      let updated = false;
      chatRoom.messages.forEach(message => {
        if (messageIds.includes(message._id.toString()) && !message.read.includes(userId)) {
          message.read.push(userId);
          updated = true;
        }
      });

      if (updated) {
        await chatRoom.save();
      }

      // Notify other users in the room about read status
      socket.to(`chatbot:${roomId}`).emit('chatbot:messageRead', {
        roomId,
        messageIds,
        userId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('chatbot:error', { error: 'Failed to update read status' });
    }
  });

  // Get online users in a room
  socket.on('chatbot:getOnlineUsers', async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit('chatbot:error', { error: 'Room ID is required' });
        return;
      }

      // Find the chat room
      const chatRoom = await Chat.findOne({ roomId });
      if (!chatRoom) {
        socket.emit('chatbot:error', { error: 'Chat room not found' });
        return;
      }

      // Get online participants
      const onlineParticipants = chatRoom.participants
        .filter(participantId => onlineUsers.has(participantId.toString()))
        .map(participantId => participantId.toString());

      socket.emit('chatbot:onlineUsers', {
        roomId,
        onlineUsers: onlineParticipants
      });
    } catch (error) {
      console.error('Error getting online users:', error);
      socket.emit('chatbot:error', { error: 'Failed to get online users' });
    }
  });
}