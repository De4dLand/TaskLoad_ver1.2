import { Server as SocketIOServer } from 'socket.io';
import chatHandler from './handlers/chatHandler.js';
import chatbotHandler from './handlers/chatbotHandler.js';
import notificationHandler from './handlers/notificationHandler.js';
import timeTrackingHandler from './handlers/timeTrackingHandler.js';
import taskChatHandler from './handlers/taskChatHandler.js';
import { emitDeadlineWarnings, handleCommentEvents } from '../socketTasks.js';

/**
 * Initialize Socket.IO server and set up all event handlers
 * @param {Object} server - HTTP server instance
 * @returns {SocketIOServer} - Socket.IO server instance
 */
export default function initializeSocketIO(server) {
  // Create Socket.IO server with CORS configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Set up middleware for authentication (optional)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // You can implement token verification here
    // If invalid: return next(new Error('Authentication error'));
    return next();
  });

  // Track online users
  const onlineUsers = new Map(); // userId -> socketId

  // Handle connection event
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // User authentication and presence tracking
    socket.on('user:login', (userData) => {
      if (userData && userData.userId) {
        // Store user connection info
        onlineUsers.set(userData.userId, socket.id);
        // Notify others that user is online
        socket.broadcast.emit('user:online', { userId: userData.userId });
        // Join user to their personal room for direct messages
        socket.join(`user:${userData.userId}`);
      }
    });
    
    // Initialize chatbot handler
    chatbotHandler(io, socket, onlineUsers);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Find and remove the disconnected user
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          // Notify others that user is offline
          socket.broadcast.emit('user:offline', { userId });
          break;
        }
      }
    });

    // Initialize all handlers
    chatHandler(io, socket, onlineUsers);
    notificationHandler(io, socket, onlineUsers);
    timeTrackingHandler(io, socket, onlineUsers);
    taskChatHandler(io, socket, onlineUsers);
  });

  // Set up periodic tasks
  // Check for upcoming deadlines every 5 minutes
  setInterval(() => {
    emitDeadlineWarnings(io, 60); // 60 = next 60 minutes
  }, 5 * 60 * 1000);

  // Handle comment events (real-time comments)
  handleCommentEvents(io);

  return io;
}

// Export utility functions for direct use
export const getOnlineStatus = (io) => {
  const onlineUsers = [];
  for (const [userId, socketId] of io.sockets.adapter.rooms.entries()) {
    if (userId.startsWith('user:')) {
      onlineUsers.push(userId.replace('user:', ''));
    }
  }
  return onlineUsers;
};

// Export function to send notification to specific user
export const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};