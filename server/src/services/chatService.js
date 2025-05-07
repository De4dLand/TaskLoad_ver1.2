import Chat from '../models/Chat.js';
import mongoose from 'mongoose';

/**
 * Service for handling chat-related operations
 */
class ChatService {
  /**
   * Create a new chat room
   * @param {Object} chatData - Chat room data
   * @returns {Promise<Object>} - Created chat room
   */
  static async createChatRoom(chatData) {
    try {
      const chat = new Chat(chatData);
      return await chat.save();
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Get or create a direct chat between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @returns {Promise<Object>} - Chat room
   */
  static async getOrCreateDirectChat(user1Id, user2Id) {
    try {
      // Try to find existing direct chat between these users
      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: { $all: [user1Id, user2Id], $size: 2 }
      });

      if (existingChat) {
        return existingChat;
      }

      // Create new direct chat
      const newChat = new Chat({
        roomId: `direct_${new mongoose.Types.ObjectId()}`,
        type: 'direct',
        participants: [user1Id, user2Id]
      });

      return await newChat.save();
    } catch (error) {
      console.error('Error getting or creating direct chat:', error);
      throw error;
    }
  }

  /**
   * Save a new message to a chat room
   * @param {string} roomId - Chat room ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Updated chat with new message
   */
  static async saveMessage(roomId, messageData) {
    try {
      const chat = await Chat.findOne({ roomId });
      if (!chat) {
        throw new Error(`Chat room not found: ${roomId}`);
      }

      chat.messages.push(messageData);
      chat.lastActivity = new Date();
      return await chat.save();
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read by a user
   * @param {string} roomId - Chat room ID
   * @param {Array<string>} messageIds - Array of message IDs
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated chat
   */
  static async markMessagesAsRead(roomId, messageIds, userId) {
    try {
      const chat = await Chat.findOne({ roomId });
      if (!chat) {
        throw new Error(`Chat room not found: ${roomId}`);
      }

      // Update read status for each message
      chat.messages.forEach(message => {
        if (messageIds.includes(message._id.toString()) && !message.read.includes(userId)) {
          message.read.push(userId);
        }
      });

      return await chat.save();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a room
   * @param {string} roomId - Chat room ID
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Object>} - Chat with messages
   */
  static async getChatHistory(roomId, options = {}) {
    try {
      const { limit = 50, skip = 0 } = options;
      
      const chat = await Chat.findOne({ roomId })
        .populate('participants', 'username firstName lastName profileImage')
        .select('roomId type participants messages lastActivity')
        .slice('messages', [skip, limit])
        .exec();

      if (!chat) {
        throw new Error(`Chat room not found: ${roomId}`);
      }

      return chat;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of chats
   */
  static async getUserChats(userId) {
    try {
      return await Chat.find({ participants: userId })
        .populate('participants', 'username firstName lastName profileImage')
        .select('roomId type participants lastActivity')
        .sort({ lastActivity: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }
}

export default ChatService;