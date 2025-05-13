import { io } from 'socket.io-client';

let socket;

/**
 * Initialize the socket connection for chat functionality
 * @param {string} token - Authentication token
 * @param {string} userId - Current user ID
 * @returns {Object} - Socket instance and utility methods
 */
export const initializeChatSocket = (token, userId) => {
  // Create socket connection if it doesn't exist
  if (!socket) {
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to chat socket');
      // Authenticate user
      socket.emit('user:login', { userId });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat socket:', reason);
    });
  }

  return {
    // Join a chat room
    joinChatRoom: (roomId) => {
      socket.emit('chat:join', { roomId });
    },

    // Leave a chat room
    leaveChatRoom: (roomId) => {
      socket.emit('chat:leave', { roomId });
    },

    // Send a message to a chat room
    sendMessage: (roomId, message, sender) => {
      socket.emit('chat:message', {
        roomId,
        message,
        sender,
        timestamp: new Date(),
      });
    },

    // Listen for new messages
    onNewMessage: (callback) => {
      socket.on('chat:message', callback);
    },

    // Listen for user presence updates
    onUserPresenceChange: (callback) => {
      socket.on('user:online', callback);
      socket.on('user:offline', callback);
    },

    // Clean up listeners when component unmounts
    cleanup: () => {
      socket.off('chat:message');
      socket.off('user:online');
      socket.off('user:offline');
    },

    // Get the socket instance
    getSocket: () => socket,
    
    // Chatbot specific methods
    // Join a chatbot room
    joinChatbotRoom: (roomId) => {
      socket.emit('chatbot:join', { roomId, userId });
    },

    // Leave a chatbot room
    leaveChatbotRoom: (roomId) => {
      socket.emit('chatbot:leave', { roomId, userId });
    },

    // Send a message to a chatbot room
    sendChatbotMessage: (roomId, content, sender) => {
      socket.emit('chatbot:message', {
        roomId,
        content,
        sender,
        timestamp: new Date(),
      });
    },

    // Listen for new chatbot messages
    onNewChatbotMessage: (callback) => {
      socket.on('chatbot:message', callback);
    },

    // Listen for typing indicators
    onTypingIndicator: (callback) => {
      socket.on('chatbot:typing', callback);
    },

    // Send typing indicator
    sendTypingIndicator: (roomId, userId, isTyping) => {
      socket.emit('chatbot:typing', { roomId, userId, isTyping });
    },

    // Mark messages as read
    markMessagesAsRead: (roomId, messageIds, userId) => {
      socket.emit('chatbot:markRead', { roomId, messageIds, userId });
    },

    // Listen for read receipts
    onMessageRead: (callback) => {
      socket.on('chatbot:messageRead', callback);
    },

    // Get online users in a room
    getOnlineUsers: (roomId) => {
      socket.emit('chatbot:getOnlineUsers', { roomId });
    },

    // Listen for online users update
    onOnlineUsersUpdate: (callback) => {
      socket.on('chatbot:onlineUsers', callback);
    },

    // Listen for user joined events
    onUserJoined: (callback) => {
      socket.on('chatbot:userJoined', callback);
    },

    // Listen for user left events
    onUserLeft: (callback) => {
      socket.on('chatbot:userLeft', callback);
    },

    // Listen for errors
    onChatbotError: (callback) => {
      socket.on('chatbot:error', callback);
    },

    // Clean up chatbot listeners
    cleanupChatbot: () => {
      socket.off('chatbot:message');
      socket.off('chatbot:typing');
      socket.off('chatbot:messageRead');
      socket.off('chatbot:onlineUsers');
      socket.off('chatbot:userJoined');
      socket.off('chatbot:userLeft');
      socket.off('chatbot:error');
    }
  };
};

/**
 * Disconnect the socket
 */
export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};