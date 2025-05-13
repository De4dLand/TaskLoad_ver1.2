import { useState, useEffect, useCallback } from 'react';
import { initializeChatSocket, disconnectChatSocket } from '../services/chatSocketService';
import { chatApiService } from '../services';

/**
 * Custom hook for managing chatbot socket connections and state
 * @param {string} token - User authentication token
 * @param {string} userId - Current user ID
 * @param {string} roomId - Chat room ID
 * @returns {Object} - Chatbot state and methods
 */
const useChatbotSocket = (token, userId, roomId) => {
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

  // Join chatbot room and load history
  useEffect(() => {
    if (!roomId || !isConnected) return;

    const chatSocket = initializeChatSocket(token, userId);
    chatSocket.joinChatbotRoom(roomId);

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
    chatSocket.onNewChatbotMessage((message) => {
      if (message.roomId === roomId) {
        setMessages((prevMessages) => [...prevMessages, message]);
        
        // Clear typing indicator when message is received
        if (message.sender && isTyping[message.sender.id]) {
          setIsTyping((prev) => ({
            ...prev,
            [message.sender.id]: false
          }));
        }
      }
    });

    // Listen for typing indicators
    chatSocket.onTypingIndicator(({ roomId: typingRoomId, userId: typingUserId, isTyping: userIsTyping }) => {
      if (typingRoomId === roomId) {
        setIsTyping((prev) => ({
          ...prev,
          [typingUserId]: userIsTyping
        }));
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

    // Listen for user joined/left events
    chatSocket.onUserJoined(({ userId: joinedUserId, roomId: joinedRoomId }) => {
      if (joinedRoomId === roomId) {
        console.log(`User ${joinedUserId} joined the chatbot room`);
      }
    });

    chatSocket.onUserLeft(({ userId: leftUserId, roomId: leftRoomId }) => {
      if (leftRoomId === roomId) {
        console.log(`User ${leftUserId} left the chatbot room`);
      }
    });

    // Listen for errors
    chatSocket.onChatbotError((error) => {
      console.error('Chatbot error:', error);
      setError(error.message || 'An error occurred with the chatbot');
    });

    // Clean up when leaving room or component unmounts
    return () => {
      chatSocket.leaveChatbotRoom(roomId);
      chatSocket.cleanupChatbot();
    };
  }, [roomId, isConnected, token, userId, isTyping]);

  // Send message function
  const sendMessage = useCallback(
    (messageText) => {
      if (!roomId || !isConnected || !messageText.trim()) return;

      const chatSocket = initializeChatSocket(token, userId);
      chatSocket.sendChatbotMessage(roomId, messageText, { id: userId });
    },
    [roomId, isConnected, token, userId]
  );

  // Send typing indicator
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

export default useChatbotSocket;