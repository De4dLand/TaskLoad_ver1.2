/**
 * Service for managing chat data storage and cleanup
 */

// Keys used in localStorage for chat data
const CHAT_KEYS = {
  MESSAGES: 'chat_messages',
  ROOMS: 'chat_rooms',
  CURRENT_ROOM: 'current_chat_room',
  // Add any other chat-related keys here
};

/**
 * Clear all chat-related data from localStorage
 * @returns {boolean} - True if successful, false otherwise
 */
export const clearChatData = () => {
  try {
    // Clear all chat-related data from localStorage
    Object.values(CHAT_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing chat data:', error);
    return false;
  }
};

/**
 * Save chat messages to localStorage
 * @param {string} roomId - The ID of the chat room
 * @param {Array} messages - Array of message objects
 */
export const saveChatMessages = (roomId, messages) => {
  try {
    const key = `${CHAT_KEYS.MESSAGES}_${roomId}`;
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
};

/**
 * Load chat messages from localStorage
 * @param {string} roomId - The ID of the chat room
 * @returns {Array} - Array of message objects or empty array if none found
 */
export const loadChatMessages = (roomId) => {
  try {
    const key = `${CHAT_KEYS.MESSAGES}_${roomId}`;
    const messages = localStorage.getItem(key);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
};

/**
 * Save the current chat room ID
 * @param {string} roomId - The ID of the current chat room
 */
export const saveCurrentRoom = (roomId) => {
  try {
    localStorage.setItem(CHAT_KEYS.CURRENT_ROOM, roomId);
  } catch (error) {
    console.error('Error saving current room:', error);
  }
};

/**
 * Get the current chat room ID
 * @returns {string|null} - The ID of the current chat room or null if not found
 */
export const getCurrentRoom = () => {
  try {
    return localStorage.getItem(CHAT_KEYS.CURRENT_ROOM);
  } catch (error) {
    console.error('Error getting current room:', error);
    return null;
  }
};

/**
 * Save chat rooms to localStorage
 * @param {Array} rooms - Array of chat room objects
 */
export const saveChatRooms = (rooms) => {
  try {
    localStorage.setItem(CHAT_KEYS.ROOMS, JSON.stringify(rooms));
  } catch (error) {
    console.error('Error saving chat rooms:', error);
  }
};

/**
 * Load chat rooms from localStorage
 * @returns {Array} - Array of chat room objects or empty array if none found
 */
export const loadChatRooms = () => {
  try {
    const rooms = localStorage.getItem(CHAT_KEYS.ROOMS);
    return rooms ? JSON.parse(rooms) : [];
  } catch (error) {
    console.error('Error loading chat rooms:', error);
    return [];
  }
};

export default {
  clearChatData,
  saveChatMessages,
  loadChatMessages,
  saveCurrentRoom,
  getCurrentRoom,
  saveChatRooms,
  loadChatRooms,
};
