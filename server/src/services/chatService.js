import Chat from '../models/Chat.js';
import mongoose from 'mongoose';
import createChatCacheService from './chatCacheService.js';
import logger from '../utils/logger.js';
import AIChatService from './aiChatService.js';

/**
 * Service for handling chat-related operations
 */
class ChatService {
  /**
   * Initialize the cache service if Redis is available
   * @param {Object} redisClient - Redis client instance
   * @param {Object} aiConfig - Configuration for AI service
   */
  static initCache(redisClient, aiConfig = {}) {
    if (redisClient) {
      this.cacheService = createChatCacheService(redisClient);
      logger.info('Chat cache service initialized');
      
      // Initialize AI chat service with the same Redis client
      AIChatService.init(redisClient, aiConfig);
    }
  }
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
   * Get all chat rooms for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of chat rooms
   */
  static async getChatRoomsByUserId(userId) {
    try {
      // Try to get from cache first
      if (this.cacheService) {
        const cachedRooms = await this.cacheService.getUserChatRooms(userId);
        if (cachedRooms) {
          logger.debug(`Retrieved ${cachedRooms.length} chat rooms from cache for user ${userId}`);
          return cachedRooms;
        }
      }

      // If not in cache, get from database
      const chatRooms = await Chat.find({ participants: userId })
        .sort({ lastActivity: -1 })
        .populate('participants', 'name email avatar')
        .select('-messages');

      // Cache the results
      if (this.cacheService) {
        await this.cacheService.setUserChatRooms(userId, chatRooms);
      }

      return chatRooms;
    } catch (error) {
      logger.error(`Error getting chat rooms for user ${userId}:`, error);
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

      const savedChat = await newChat.save();
      
      // Invalidate user cache for both users
      if (this.cacheService) {
        await this.cacheService.invalidateUserChatRooms(user1Id);
        await this.cacheService.invalidateUserChatRooms(user2Id);
      }
      
      return savedChat;
    } catch (error) {
      logger.error('Error getting or creating direct chat:', error);
      throw error;
    }
  }

  /**
   * Get a chat room by ID
   * @param {string} roomId - Chat room ID
   * @returns {Promise<Object>} - Chat room
   */
  static async getChatRoomById(roomId) {
    try {
      // Try to get from cache first
      if (this.cacheService) {
        const cachedRoom = await this.cacheService.getChatRoom(roomId);
        if (cachedRoom) {
          logger.debug(`Retrieved chat room ${roomId} from cache`);
          return cachedRoom;
        }
      }

      // If not in cache, get from database
      const chatRoom = await Chat.findOne({ roomId })
        .populate('participants', 'name email avatar');

      if (!chatRoom) {
        return null;
      }

      // Cache the results
      if (this.cacheService) {
        await this.cacheService.setChatRoom(roomId, chatRoom);
      }

      return chatRoom;
    } catch (error) {
      logger.error(`Error getting chat room ${roomId}:`, error);
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
      const updatedChat = await chat.save();
      
      // Invalidate cache for this room
      if (this.cacheService) {
        await this.cacheService.invalidateChatRoom(roomId);
        
        // Invalidate cache for all participants
        for (const participantId of chat.participants) {
          await this.cacheService.invalidateUserChatRooms(participantId.toString());
        }
      }
      
      // Check if message is directed to AI and process it
      if (AIChatService.isMessageForAI(messageData.content)) {
        await this.processAIMessage(roomId, messageData, chat.messages);
      }
      
      return updatedChat;
    } catch (error) {
      logger.error('Error saving message:', error);
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


  /**
   * Process a message directed to the AI assistant
   * @param {string} roomId - Chat room ID
   * @param {Object} messageData - User message data
   * @param {Array} messages - All messages in the chat
   * @returns {Promise<Object>} - AI response message
   */
  static async processAIMessage(roomId, messageData, messages) {
    try {
      // Extract the actual query from the message
      const query = AIChatService.extractAIQuery(messageData.content);
      
      // Update the message data with the extracted query
      const processedMessage = {
        ...messageData,
        content: query
      };
      
      // Get recent messages for context
      const recentMessages = messages.slice(-10); // Last 10 messages for context
      
      // Generate AI response
      const aiResponse = await AIChatService.processMessage(roomId, processedMessage, recentMessages);
      
      // Save the AI response as a new message
      await this.saveAIResponse(roomId, aiResponse);
      
      return aiResponse;
    } catch (error) {
      logger.error('Error processing AI message:', error);
      throw error;
    }
  }
  
  /**
   * Save an AI-generated response to the chat
   * @param {string} roomId - Chat room ID
   * @param {Object} responseData - AI response data
   * @returns {Promise<Object>} - Updated chat with AI response
   */
  static async saveAIResponse(roomId, responseData) {
    try {
      const chat = await Chat.findOne({ roomId });
      if (!chat) {
        throw new Error(`Chat room not found: ${roomId}`);
      }
      
      // Add AI response to messages
      chat.messages.push(responseData);
      chat.lastActivity = new Date();
      
      const updatedChat = await chat.save();
      
      // Invalidate cache for this room
      if (this.cacheService) {
        await this.cacheService.invalidateChatRoom(roomId);
        
        // Invalidate cache for all participants
        for (const participantId of chat.participants) {
          await this.cacheService.invalidateUserChatRooms(participantId.toString());
        }
      }
      
      return updatedChat;
    } catch (error) {
      logger.error('Error saving AI response:', error);
      throw error;
    }
  }
}

export default ChatService;