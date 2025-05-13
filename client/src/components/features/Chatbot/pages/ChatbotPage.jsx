import React, { useContext } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ChatInterface } from '../components';
import { AuthContext } from '../../../../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';

/**
 * ChatbotPage component
 * Provides a dedicated page for the chatbot functionality
 * Wraps the ChatInterface component with necessary context providers
 */
const ChatbotPage = () => {
  const { currentUser } = useContext(AuthContext);
  
  // Default room ID for general chatbot interactions
  // In a real application, this could be dynamically determined
  const defaultRoomId = 'ai-assistant';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      padding: 2
    }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Assistant
      </Typography>
      
      <Paper 
        elevation={3}
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <ChatProvider>
          <ChatInterface 
            currentUser={currentUser} 
            roomId={defaultRoomId} 
          />
        </ChatProvider>
      </Paper>
    </Box>
  );
};

export default ChatbotPage;