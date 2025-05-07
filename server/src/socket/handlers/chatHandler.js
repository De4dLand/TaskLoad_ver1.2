import mongoose from 'mongoose';

/**
 * Handles all chat-related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 * @param {Map} onlineUsers - Map of online users (userId -> socketId)
 */
export default function chatHandler(io, socket, onlineUsers) {
  // Join a chat room
  socket.on('chat:join', ({ roomId }) => {
    if (roomId) {
      socket.join(`chat:${roomId}`);
      console.log(`Socket ${socket.id} joined chat room: ${roomId}`);
    }
  });

  // Leave a chat room
  socket.on('chat:leave', ({ roomId }) => {
    if (roomId) {
      socket.leave(`chat:${roomId}`);
      console.log(`Socket ${socket.id} left chat room: ${roomId}`);
    }
  });

  // Send a message to a chat room
  socket.on('chat:message', async (messageData) => {
    try {
      const { roomId, message, sender, timestamp = new Date() } = messageData;
      
      if (!roomId || !message || !sender) {
        socket.emit('chat:error', { error: 'Invalid message data' });
        return;
      }

      // Create message object
      const chatMessage = {
        _id: new mongoose.Types.ObjectId(),
        roomId,
        message,
        sender,
        timestamp,
        read: [sender] // Mark as read by sender
      };

      // Save message to database
      const savedMessage = await import('../../services/chatService.js')
        .then(module => module.default.saveMessage(roomId, chatMessage))
        .catch(err => {
          console.error('Error importing chat service:', err);
          return chatMessage; // Fallback to original message if service fails
        });

      // Broadcast to everyone in the room
      io.to(`chat:${roomId}`).emit('chat:message', chatMessage);

      // Send notification to offline users who are part of this room
      // This would require knowledge of room members, which could be fetched from DB
      // or maintained in memory
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('chat:error', { error: 'Failed to process message' });
    }
  });

  // Mark messages as read
  socket.on('chat:markRead', async ({ roomId, messageIds, userId }) => {
    try {
      if (!roomId || !messageIds || !userId) {
        socket.emit('chat:error', { error: 'Invalid read receipt data' });
        return;
      }

      // TODO: Update messages in database
      // await ChatService.markMessagesAsRead(messageIds, userId);

      // Notify other users in the room about read status
      socket.to(`chat:${roomId}`).emit('chat:messageRead', {
        roomId,
        messageIds,
        userId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('chat:error', { error: 'Failed to update read status' });
    }
  });

  // Handle typing indicator
  socket.on('chat:typing', ({ roomId, userId, isTyping }) => {
    if (roomId && userId) {
      socket.to(`chat:${roomId}`).emit('chat:typing', {
        roomId,
        userId,
        isTyping
      });
    }
  });
}