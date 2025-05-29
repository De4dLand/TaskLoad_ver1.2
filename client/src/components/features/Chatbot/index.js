// Chatbot feature module exports
import { 
  ChatInterface, 
  ChatBot, 
  ChatRoom, 
  ChatbotDialog, 
  ChatbotButton 
} from './components';
import { chatApiService, initializeChatSocket, disconnectChatSocket } from './services';
import { useChatSocket } from './hooks';
import { ChatProvider, useChatContext } from './contexts/ChatContext';

// Export components
export { 
  ChatInterface, 
  ChatBot, 
  ChatRoom, 
  ChatbotDialog, 
  ChatbotButton 
};

// Export services
export { chatApiService, initializeChatSocket, disconnectChatSocket };

// Export hooks
export { useChatSocket };

// Export contexts
export { ChatProvider, useChatContext };

// Default export for the main component
export { ChatbotButton as default };