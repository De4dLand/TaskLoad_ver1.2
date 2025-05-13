import logger from '../utils/logger.js';

/**
 * Service for caching chat data in Redis
 * Improves performance by reducing database queries
 */
class ChatCacheService {
  /**
   * Initialize the Redis client
   * @param {Object} redisClient - Redis client instance
   */
  constructor(redisClient) {
    this.redis = redisClient;
    this.keyPrefix = 'chat:';
    this.expiration = 3600; // 1 hour in seconds
  }

  /**
   * Get a chat room from cache
   * @param {string} roomId - Chat room ID
   * @returns {Promise<Object|null>} - Cached chat room or null if not found
   */
  async getChatRoom(roomId) {
    try {
      const key = `${this.keyPrefix}room:${roomId}`;
      const cachedRoom = await this.redis.get(key);
      
      if (cachedRoom) {
        return JSON.parse(cachedRoom);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Cache a chat room
   * @param {string} roomId - Chat room ID
   * @param {Object} roomData - Chat room data to cache
   * @returns {Promise<boolean>} - Success status
   */
  async setChatRoom(roomId, roomData) {
    try {
      const key = `${this.keyPrefix}room:${roomId}`;
      await this.redis.set(key, JSON.stringify(roomData), 'EX', this.expiration);
      return true;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return false; // Fail gracefully
    }
  }

  /**
   * Get recent messages for a chat room from cache
   * @param {string} roomId - Chat room ID
   * @returns {Promise<Array|null>} - Cached messages or null if not found
   */
  async getRecentMessages(roomId) {
    try {
      const key = `${this.keyPrefix}messages:${roomId}`;
      const cachedMessages = await this.redis.get(key);
      
      if (cachedMessages) {
        return JSON.parse(cachedMessages);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Cache recent messages for a chat room
   * @param {string} roomId - Chat room ID
   * @param {Array} messages - Messages to cache
   * @returns {Promise<boolean>} - Success status
   */
  async setRecentMessages(roomId, messages) {
    try {
      const key = `${this.keyPrefix}messages:${roomId}`;
      await this.redis.set(key, JSON.stringify(messages), 'EX', this.expiration);
      return true;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return false; // Fail gracefully
    }
  }

  /**
   * Get user's chat rooms from cache
   * @param {string} userId - User ID
   * @returns {Promise<Array|null>} - Cached chat rooms or null if not found
   */
  async getUserChatRooms(userId) {
    try {
      const key = `${this.keyPrefix}user:${userId}:rooms`;
      const cachedRooms = await this.redis.get(key);
      
      if (cachedRooms) {
        return JSON.parse(cachedRooms);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Cache user's chat rooms
   * @param {string} userId - User ID
   * @param {Array} rooms - Chat rooms to cache
   * @returns {Promise<boolean>} - Success status
   */
  async setUserChatRooms(userId, rooms) {
    try {
      const key = `${this.keyPrefix}user:${userId}:rooms`;
      await this.redis.set(key, JSON.stringify(rooms), 'EX', this.expiration);
      return true;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return false; // Fail gracefully
    }
  }

  /**
   * Invalidate cache for a chat room
   * @param {string} roomId - Chat room ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateChatRoom(roomId) {
    try {
      const roomKey = `${this.keyPrefix}room:${roomId}`;
      const messagesKey = `${this.keyPrefix}messages:${roomId}`;
      
      await this.redis.del(roomKey);
      await this.redis.del(messagesKey);
      
      return true;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return false; // Fail gracefully
    }
  }

  /**
   * Invalidate cache for a user's chat rooms
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateUserChatRooms(userId) {
    try {
      const key = `${this.keyPrefix}user:${userId}:rooms`;
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis cache error:', error);
      return false; // Fail gracefully
    }
  }
}

// Export a factory function to create the service with the Redis client
export default function createChatCacheService(redisClient) {
  return new ChatCacheService(redisClient);
}