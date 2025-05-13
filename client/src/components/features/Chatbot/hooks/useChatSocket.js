import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeChatSocket, disconnectChatSocket } from '../services/chatSocketService';
import { chatApiService } from '../services';

/**
 * Custom hook for managing chat socket connections and state
 * @param {string} token - User authentication token
 * @param {string} userId - Current user ID
 * @param {string} roomId - Chat room ID
 * @returns {Object} - Chat state and methods
 */
const useChatSocket = (token, userId, roomId) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState({});

  // Initialize socket connection
  useEffect(() => {
    if (!token || !userId) return;

    const chatSocket = initializeChatSocket(token, userId);
    const socket = chatSocket.getSocket();

    // Set up connection status listener
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      disconnectChatSocket();
    };
  }, [token, userId]);

  // Join chat room and load history
  useEffect(() => {
    if (!roomId || !isConnected) return;

    const chatSocket = initializeChatSocket(token, userId);
    chatSocket.joinChatRoom(roomId);

    // Load chat history
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const history = await chatApiService.fetchChatHistory(roomId);
        setMessages(history);
        setError(null);
      } catch (err) {
        setError('Failed to load chat history');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();

    // Listen for new messages
    chatSocket.onNewMessage((message) => {
      if (message.roomId === roomId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Listen for user presence changes
    chatSocket.onUserPresenceChange((data) => {
      if (data.online) {
        setOnlineUsers((prev) => {
          if (!prev.some((user) => user.id === data.userId)) {
            return [...prev, { id: data.userId, name: data.username }];
          }
          return prev;
        });
      } else {
        setOnlineUsers((prev) => 
          prev.filter((user) => user.id !== data.userId)
        );
      }
    });
    
    // Listen for typing indicators
    chatSocket.onTypingIndicator((data) => {
      if (data.roomId === roomId) {
        setIsTyping(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));
        
        // Auto-clear typing indicator after 5 seconds if no updates
        if (data.isTyping) {
          setTimeout(() => {
            setIsTyping(prev => ({
              ...prev,
              [data.userId]: false
            }));
          }, 5000);
        }
      }
    });
    
    // Listen for read receipts
    chatSocket.onMessageRead((data) => {
      if (data.roomId === roomId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (data.messageIds.includes(msg.id)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), data.userId]
              };
            }
            return msg;
          })
        );
      }
    });

    // Clean up when leaving room or component unmounts
    return () => {
      chatSocket.leaveChatRoom(roomId);
      chatSocket.cleanup();
    };
  }, [roomId, isConnected, token, userId]);

  // Send message function
  const sendMessage = useCallback(
    (messageText) => {
      if (!roomId || !isConnected || !messageText.trim()) return;

      const chatSocket = initializeChatSocket(token, userId);
      chatSocket.sendChatbotMessage(roomId, messageText, userId);
    },
    [roomId, isConnected, token, userId]
  );
  
  // Send typing status
  const sendTypingStatus = useCallback(
    (isTyping) => {
      if (!roomId || !isConnected) return;
      
      const chatSocket = initializeChatSocket(token, userId);
      chatSocket.sendTypingIndicator(roomId, userId, isTyping);
    },
    [roomId, isConnected, token, userId]
  );
  
  // Mark messages as read
  const markAsRead = useCallback(
    (messageIds) => {
      if (!roomId || !isConnected || !messageIds.length) return;
      
      const chatSocket = initializeChatSocket(token, userId);
      chatSocket.markMessagesAsRead(roomId, messageIds, userId);
    },
    [roomId, isConnected, token, userId]
  );

  return {
    messages,
    onlineUsers,
    isConnected,
    isLoading,
    error,
    isTyping,
    sendMessage,
    sendTypingStatus,
    markAsRead,
  };
};

export default useChatSocket;