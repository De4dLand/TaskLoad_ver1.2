/**
 * AI service configuration
 */

export default {
  // AI provider configuration
  provider: process.env.AI_PROVIDER || 'default',
  apiKey: process.env.AI_API_KEY,
  apiEndpoint: process.env.AI_API_ENDPOINT,
  
  // Conversation settings
  contextWindowSize: parseInt(process.env.AI_CONTEXT_WINDOW_SIZE || '10', 10),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  
  // Rate limiting
  rateLimit: {
    maxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10), // Max requests per window
    timeWindow: parseInt(process.env.AI_RATE_LIMIT_WINDOW || '3600', 10), // Time window in seconds (default: 1 hour)
  },
  
  // Caching
  cacheTTL: parseInt(process.env.AI_CACHE_TTL || '3600', 10), // Cache TTL in seconds (default: 1 hour)
  
  // AI assistant persona
  persona: process.env.AI_PERSONA || 'helpful assistant',
  
  // Enable/disable AI features
  enabled: process.env.AI_ENABLED !== 'false',
};