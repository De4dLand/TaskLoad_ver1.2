import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatApiService } from '../services';

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

  // Fetch user's chat rooms on mount
  useEffect(() => {
    if (!userId) return;
    
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const rooms = await chatApiService.fetchUserChatRooms();
        setChatRooms(rooms);
        
        // Set first room as current if available and no current room is selected
        if (rooms.length > 0 && !currentRoomId) {
          setCurrentRoomId(rooms[0]._id);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load chat rooms');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [userId, currentRoomId]);

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

  // Context value
  const value = {
    chatRooms,
    currentRoomId,
    isLoading,
    error,
    createRoom,
    switchRoom,
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