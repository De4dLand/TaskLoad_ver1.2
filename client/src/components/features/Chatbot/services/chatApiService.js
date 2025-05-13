/**
 * API service for chat-related operations
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch chat history for a specific room
 * @param {string} roomId - ID of the chat room
 * @param {number} limit - Maximum number of messages to fetch
 * @param {number} skip - Number of messages to skip (for pagination)
 * @returns {Promise<Array>} - Array of chat messages
 */
export const fetchChatHistory = async (roomId, limit = 50, skip = 0) => {
  try {
    const response = await fetch(
      `${API_URL}/api/chat/${roomId}?limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Create a new chat room
 * @param {Object} roomData - Data for the new chat room
 * @param {string} roomData.name - Name of the chat room
 * @param {Array<string>} roomData.participants - Array of user IDs who are participants
 * @returns {Promise<Object>} - Created chat room data
 */
export const createChatRoom = async (roomData) => {
  try {
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(roomData),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat room');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

/**
 * Fetch all chat rooms for the current user
 * @returns {Promise<Array>} - Array of chat rooms
 */
export const fetchUserChatRooms = async () => {
  try {
    const response = await fetch(`${API_URL}/api/chat/rooms/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user chat rooms');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user chat rooms:', error);
    throw error;
  }
};