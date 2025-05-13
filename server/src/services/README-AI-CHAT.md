# AI Chat Integration

This document provides an overview of the AI chat integration implemented in the TaskLoad application.

## Overview

The AI chat integration allows users to interact with an AI assistant within the chat interface. The AI can respond to direct queries, provide suggestions, and assist with various tasks.

## Components

### 1. AI Chat Service (`aiChatService.js`)

The core service that handles AI-specific functionality:

- Processing user messages directed to the AI
- Generating AI responses
- Managing conversation context
- Providing message suggestions

### 2. Chat Service Integration (`chatService.js`)

The existing chat service has been extended to:

- Detect messages directed to the AI
- Process AI messages and generate responses
- Save AI responses to the chat history

### 3. Socket Handlers

- `chatHandler.js` - Updated to use the ChatService for message processing
- `chatbotHandler.js` - Enhanced to support AI-specific events and interactions

### 4. Configuration (`ai.js`)

A dedicated configuration file for AI-related settings:

- AI provider settings
- Conversation context settings
- Rate limiting
- Caching parameters

## Usage

### Talking to the AI

Users can interact with the AI by prefixing their messages with `@ai`:

```
@ai What's the status of the project?
```

The AI will automatically process the message and respond in the chat.

### Getting Suggestions

Users can request suggestions for message drafts using the `chatbot:suggest` socket event:

```javascript
socket.emit('chatbot:suggest', {
  roomId: 'room-id',
  draftMessage: 'Draft message text',
  userId: 'user-id'
});
```

The AI will respond with a suggested improvement to the draft message.

## Implementation Details

### Conversation Context

The AI maintains conversation context to provide more relevant responses:

- Context is stored in Redis cache
- Default context window is 10 messages
- Context includes both user messages and AI responses

### Redis Caching

Redis is used to cache:

- Conversation context
- Recent messages
- Chat room data

### AI Provider Integration

The current implementation includes a placeholder for AI provider integration. To connect to a specific AI provider:

1. Update the `generateAIResponse` method in `aiChatService.js`
2. Configure the provider details in `config/ai.js`
3. Set the appropriate environment variables

## Environment Variables

The following environment variables can be used to configure the AI service:

- `AI_PROVIDER` - The AI provider to use (default: 'default')
- `AI_API_KEY` - API key for the AI provider
- `AI_API_ENDPOINT` - Endpoint URL for the AI provider
- `AI_CONTEXT_WINDOW_SIZE` - Number of messages to include in context (default: 10)
- `AI_MAX_TOKENS` - Maximum tokens for AI response (default: 1000)
- `AI_TEMPERATURE` - Creativity level (0.0-1.0) (default: 0.7)
- `AI_RATE_LIMIT_MAX` - Maximum requests per time window (default: 20)
- `AI_RATE_LIMIT_WINDOW` - Time window in seconds (default: 3600)
- `AI_CACHE_TTL` - Cache TTL in seconds (default: 3600)
- `AI_PERSONA` - AI assistant persona (default: 'helpful assistant')
- `AI_ENABLED` - Enable/disable AI features (default: true)

## Future Enhancements

- Implement actual AI provider integration (OpenAI, Azure, etc.)
- Add support for multi-modal messages (images, files)
- Implement more advanced context management
- Add user-specific AI preferences
- Support for AI-generated visualizations and data analysis