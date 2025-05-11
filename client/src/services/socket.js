import { io } from 'socket.io-client';

// Get the Socket.IO server URL from environment variables or use default
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// Create a singleton socket instance with proper configuration
let socket = null;

/**
 * Initialize and get the socket connection
 * @param {Object} user - The current user object
 * @returns {Socket} The socket.io client instance
 */
export const getSocket = (user) => {
  if (!socket) {
    // Configure socket with proper transport options
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: user ? { userId: user._id } : {}
    });

    // Add connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a room for targeted messages
 * @param {string} roomId - The room ID to join
 */
export const joinRoom = (roomId) => {
  if (socket) {
    socket.emit('joinRoom', { roomId });
  }
};

/**
 * Leave a room
 * @param {string} roomId - The room ID to leave
 */
export const leaveRoom = (roomId) => {
  if (socket) {
    socket.emit('leaveRoom', { roomId });
  }
};

export default {
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom
};