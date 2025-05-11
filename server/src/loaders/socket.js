import { Server as SocketIOServer } from 'socket.io';
import { emitDeadlineWarnings, handleCommentEvents } from '../socketTasks.js';
import logger from '../utils/logger.js';

/**
 * Initialize Socket.IO server with all event handlers
 * @param {Object} server - HTTP server instance
 * @returns {SocketIOServer} - Configured Socket.IO server instance
 */
export default async (server) => {
  try {
    // Import the Socket.IO initialization function
    const initializeSocketIO = (await import('../socket/index.js')).default;
    
    // Initialize Socket.IO with all handlers
    const io = initializeSocketIO(server);
    
    // Set up periodic tasks
    // Check for upcoming deadlines every 5 minutes
    setInterval(() => {
      emitDeadlineWarnings(io, 60); // 60 = next 60 minutes
    }, 5 * 60 * 1000);
    
    // Handle comment events (real-time comments)
    handleCommentEvents(io);
    
    logger.info('Socket.IO initialized successfully');
    
    return io;
  } catch (error) {
    logger.error('Error initializing Socket.IO:', error);
    throw error;
  }
};