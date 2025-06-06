import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chatApiService } from '../services';
import { 
  clearChatData as storageClearChatData,
  saveChatMessages,
  loadChatMessages,
  saveCurrentRoom,
  getCurrentRoom,
  saveChatRooms,
  loadChatRooms
} from '../services/chatStorageService';

// Create context
const ChatContext = createContext();

/**
 * Provider component for chat-related state and functionality
 * Manages chat rooms, current room, and provides methods for chat operations
 */
export const ChatProvider = ({ children, userId }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch chat rooms
  const fetchRooms = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Try to load from localStorage first
      const cachedRooms = loadChatRooms();
      if (cachedRooms.length > 0) {
        setChatRooms(cachedRooms);
      }
      
      // Then fetch from API
      const apiRooms = await chatApiService.fetchUserChatRooms();
      setChatRooms(apiRooms);
      
      // Save to localStorage
      saveChatRooms(apiRooms);
      
      // Set current room if not set
      if (apiRooms.length > 0) {
        const savedRoomId = getCurrentRoom();
        const validRoom = savedRoomId && apiRooms.some(room => room._id === savedRoomId);
        const roomIdToSet = validRoom ? savedRoomId : apiRooms[0]._id;
        
        if (roomIdToSet !== currentRoomId) {
          setCurrentRoomId(roomIdToSet);
        }
        
        if (!validRoom) {
          saveCurrentRoom(roomIdToSet);
        }
      } else {
        setCurrentRoomId(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
      setError('Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentRoomId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Create a new chat room
  const createRoom = async (roomData) => {
    try {
      setIsLoading(true);
      const newRoom = await chatApiService.createChatRoom(roomData);
      setChatRooms((prevRooms) => [...prevRooms, newRoom]);
      setCurrentRoomId(newRoom._id);
      return newRoom;
    } catch (err) {
      setError('Failed to create chat room');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a different chat room
  const switchRoom = (roomId) => {
    setCurrentRoomId(roomId);
  };

  // Clear all chat data from storage and reset state
  const clearChatData = useCallback(async () => {
    try {
      // Clear chat data from storage
      await storageClearChatData();
      
      // Reset state
      setChatRooms([]);
      setCurrentRoomId(null);
      setError(null);
      
      // Refetch rooms to get fresh data
      if (userId) {
        fetchRooms();
      }
      
      return true;
    } catch (err) {
      console.error('Error clearing chat data:', err);
      setError('Failed to clear chat data');
      return false;
    }
  }, [userId, fetchRooms]);

  // Context value
  const value = {
    chatRooms,
    currentRoomId,
    isLoading,
    error,
    createRoom,
    switchRoom,
    clearChatData,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;