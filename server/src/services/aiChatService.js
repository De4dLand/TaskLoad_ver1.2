import logger from '../utils/logger.js';
import createChatCacheService from './chatCacheService.js';

/**
 * Service for handling AI-powered chat functionality
 * Integrates with external AI providers and manages conversation context
 */
class AIChatService {
  /**
   * Initialize the AI chat service
   * @param {Object} redisClient - Redis client for caching conversation context
   * @param {Object} config - Configuration for AI service
   */
  static init(redisClient, config = {}) {
    this.config = {
      contextWindowSize: config.contextWindowSize || 10, // Number of previous messages to include as context
      maxTokens: config.maxTokens || 1000, // Maximum tokens for AI response
      temperature: config.temperature || 0.7, // Creativity level (0.0-1.0)
      aiProvider: config.provider || 'default', // AI provider to use
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint,
      cacheTTL: config.cacheTTL || 3600,
      rateLimit: config.rateLimit || { maxRequests: 20, timeWindow: 3600 },
      persona: config.persona || 'helpful assistant',
      enabled: config.enabled !== false
    };
    
    // Initialize Redis cache for conversation context if available
    if (redisClient) {
      this.cacheService = createChatCacheService(redisClient);
      logger.info('AI Chat context cache initialized');
    }
    
    logger.info('AI Chat service initialized with provider:', this.config.aiProvider);
  }
  
  /**
   * Process a user message and generate an AI response
   * @param {string} roomId - Chat room ID
   * @param {Object} message - User message object
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @returns {Promise<Object>} - AI response message
   */
  static async processMessage(roomId, message, conversationHistory = []) {
    try {
      // Get conversation context from cache or use provided history
      let context = conversationHistory;
      if (this.cacheService && !conversationHistory.length) {
        const cachedContext = await this.getConversationContext(roomId);
        if (cachedContext) {
          context = cachedContext;
        }
      }
      
      // Prepare context window (last N messages)
      const contextWindow = this.prepareContextWindow(context, message);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(contextWindow);
      
      // Update conversation context in cache
      if (this.cacheService) {
        await this.updateConversationContext(roomId, contextWindow, aiResponse);
      }
      
      return {
        content: aiResponse,
        timestamp: new Date(),
        sender: 'ai-assistant', // Special ID for AI
        isAI: true,
        read: [] // No one has read it yet
      };
    } catch (error) {
      logger.error('Error processing AI message:', error);
      throw error;
    }
  }
  
  /**
   * Prepare the context window for AI processing
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} currentMessage - Current user message
   * @returns {Array} - Context window for AI
   */
  static prepareContextWindow(conversationHistory, currentMessage) {
    // Start with existing conversation history
    const contextWindow = [...conversationHistory];
    
    // Add current message
    contextWindow.push(currentMessage);
    
    // Limit to configured window size
    return contextWindow.slice(-this.config.contextWindowSize);
  }
  
  /**
   * Generate AI response based on conversation context
   * @param {Array} contextWindow - Conversation context window
   * @returns {Promise<string>} - AI generated response
   */
  static async generateAIResponse(contextWindow) {
    try {
      // Format messages for AI provider
      const formattedMessages = this.formatMessagesForAI(contextWindow);
      
      // Determine which AI provider to use based on configuration
      switch (this.config.aiProvider) {
        case 'openai':
          return await this.generateOpenAIResponse(formattedMessages);
        case 'azure':
          return await this.generateAzureAIResponse(formattedMessages);
        case 'default':
        default:
          // Use a simple rule-based response for testing
          return this.generateDefaultResponse(contextWindow);
      }
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
  
  /**
   * Format messages for AI provider API
   * @param {Array} messages - Messages to format
   * @returns {Array} - Formatted messages
   */
  static formatMessagesForAI(messages) {
    return messages.map(msg => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: msg.content
    }));
  }
  
  /**
   * Get conversation context from cache
   * @param {string} roomId - Chat room ID
   * @returns {Promise<Array|null>} - Conversation context or null if not found
   */
  static async getConversationContext(roomId) {
    try {
      if (!this.cacheService) return null;
      
      const key = `ai:context:${roomId}`;
      const cachedContext = await this.cacheService.redis.get(key);
      
      if (cachedContext) {
        return JSON.parse(cachedContext);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting AI conversation context:', error);
      return null; // Fail gracefully
    }
  }
  
  /**
   * Update conversation context in cache
   * @param {string} roomId - Chat room ID
   * @param {Array} contextWindow - Current context window
   * @param {string} aiResponse - AI generated response
   * @returns {Promise<boolean>} - Success status
   */
  static async updateConversationContext(roomId, contextWindow, aiResponse) {
    try {
      if (!this.cacheService) return false;
      
      // Add AI response to context window
      const updatedContext = [...contextWindow, {
        content: aiResponse,
        isAI: true,
        timestamp: new Date()
      }];
      
      // Limit to configured window size
      const finalContext = updatedContext.slice(-this.config.contextWindowSize);
      
      // Save to cache with expiration
      const key = `ai:context:${roomId}`;
      await this.cacheService.redis.set(key, JSON.stringify(finalContext), 'EX', 3600); // 1 hour expiration
      
      return true;
    } catch (error) {
      logger.error('Error updating AI conversation context:', error);
      return false; // Fail gracefully
    }
  }
  
  /**
   * Generate response using OpenAI API
   * @param {Array} messages - Formatted messages for OpenAI
   * @returns {Promise<string>} - AI generated response
   */
  static async generateOpenAIResponse(messages) {
    try {
      // This would be replaced with actual OpenAI API call
      // Example with OpenAI Node.js SDK:
      // const response = await openai.chat.completions.create({
      //   model: "gpt-3.5-turbo",
      //   messages: messages,
      //   max_tokens: this.config.maxTokens,
      //   temperature: this.config.temperature,
      // });
      // return response.choices[0].message.content;
      
      // For now, return a simulated response
      logger.info('Simulating OpenAI response with messages:', messages.length);
      return `This is a simulated OpenAI response based on ${messages.length} messages in the conversation.`;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
  
  /**
   * Generate response using Azure OpenAI API
   * @param {Array} messages - Formatted messages for Azure OpenAI
   * @returns {Promise<string>} - AI generated response
   */
  static async generateAzureAIResponse(messages) {
    try {
      // This would be replaced with actual Azure OpenAI API call
      // Example with Azure OpenAI SDK:
      // const response = await azureOpenai.chat.completions.create({
      //   deployment_id: "your-deployment-id",
      //   messages: messages,
      //   max_tokens: this.config.maxTokens,
      //   temperature: this.config.temperature,
      // });
      // return response.choices[0].message.content;
      
      // For now, return a simulated response
      logger.info('Simulating Azure OpenAI response with messages:', messages.length);
      return `This is a simulated Azure OpenAI response based on ${messages.length} messages in the conversation.`;
    } catch (error) {
      logger.error('Azure OpenAI API error:', error);
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
  }
  
  /**
   * Generate a simple rule-based response for testing
   * @param {Array} contextWindow - Conversation context window
   * @returns {string} - Generated response
   */
  static generateDefaultResponse(contextWindow) {
    // Get the last user message
    const lastMessage = contextWindow[contextWindow.length - 1];
    const query = lastMessage.content || '';
    
    // Simple rule-based responses
    if (query.includes('hello') || query.includes('hi')) {
      return 'Hello! How can I assist you today?';
    } else if (query.includes('help')) {
      return 'I\'m here to help! You can ask me about tasks, projects, or any other assistance you need.';
    } else if (query.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help with?';
    } else if (query.includes('task') || query.includes('project')) {
      return 'I can help you manage your tasks and projects. Would you like me to show you how to create a new task or project?';
    } else {
      return `I received your message: "${query}". How can I assist you with this?`;
    }
  }
  
  /**
   * Check if a message is directed to the AI assistant
   * @param {string} content - Message content
   * @returns {boolean} - True if message is for AI
   */
  static isMessageForAI(content) {
    // Check if message starts with @ai or similar trigger, or if it's in an AI-dedicated room
    return content.trim().toLowerCase().startsWith('@ai') || content.trim().toLowerCase().includes('ai:');
  }
  /**
   * Extract the actual query from a message directed to AI
   * @param {string} content - Message content
   * @returns {string} - Extracted query
   */
  static extractAIQuery(content) {
    // Remove the @ai prefix and trim
    return content.replace(/^@ai/i, '').trim();
  }
  
  /**
   * Generate a suggestion for a message draft
   * @param {string} draftMessage - The user's draft message
   * @param {string} roomId - Chat room ID for context
   * @returns {Promise<string>} - AI generated suggestion
   */
  static async generateSuggestion(draftMessage, roomId) {
    try {
      // Get conversation context if available
      let context = [];
      if (this.cacheService) {
        const cachedContext = await this.getConversationContext(roomId);
        if (cachedContext) {
          context = cachedContext;
        }
      }
      
      // Format the prompt for suggestion generation
      const prompt = `Based on the draft message: "${draftMessage}", suggest an improved or alternative version.`;
      
      // Create a temporary message object for the draft
      const draftMessageObj = {
        content: prompt,
        isAI: false,
        timestamp: new Date()
      };
      
      // Add to context window
      const contextWindow = this.prepareContextWindow(context, draftMessageObj);
      
      // Generate suggestion using the AI
      // This is a simplified version - in production, you would call the AI provider
      // TODO: Replace with actual AI provider integration
      return `Here's a suggestion based on your draft: "${draftMessage}"

Improved version: ${draftMessage} [AI suggestion placeholder - this would be an actual AI-generated suggestion in production]`;
    } catch (error) {
      logger.error('Error generating AI suggestion:', error);
      throw new Error('Failed to generate suggestion');
    }
  }
}

export default AIChatService;