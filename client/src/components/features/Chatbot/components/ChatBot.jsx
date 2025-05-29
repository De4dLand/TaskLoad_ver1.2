import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Avatar, 
  CircularProgress,
  Paper,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import styles from './ChatInterface.module.css';

/**
 * ChatBot component provides an AI chat interface using Google's Gemini API
 * Includes message history, input area, and loading states
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID for the current user
 */
const ChatBot = ({ userId }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDjOqnhYwDG4iOGC8KuqL5rg5T_Mgd2MTg';

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = { text: inputText, isUser: true, timestamp: new Date().toISOString() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Check for API key
    if (!apiKey) {
      console.error("API key Gemini not provided!");
      setMessages(prevMessages => [
        ...prevMessages, 
        { text: "Error: API key not configured.", isUser: false, timestamp: new Date().toISOString() }
      ]);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Format message history for Gemini
      const chat = model.startChat({
        history: messages.map(msg => ({ 
          role: msg.isUser ? "user" : "model", 
          parts: 
          [
            {text:msg.text }
          ]
        })),
      });

      // Send message to Gemini
      const result = await chat.sendMessage(inputText);
      const responseText = result.response.text();
      
      // Add AI response to chat
      const aiMessage = { 
        text: responseText, 
        isUser: false, 
        timestamp: new Date().toISOString() 
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setError("Failed to communicate with AI.");
      setMessages(prevMessages => [
        ...prevMessages, 
        { text: "An error occurred while communicating with AI.", isUser: false, timestamp: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.paper,
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {/* Message container */}
      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7,
              p: 3
            }}
          >
            <BotIcon sx={{ fontSize: 48, mb: 2, color: theme.palette.primary.main }} />
            <Typography variant="body1" align="center">
              Hi! I'm your AI assistant. How can I help you today?
            </Typography>
            <Typography variant="body2" align="center" sx={{ mt: 1, color: theme.palette.text.secondary }}>
              Ask me about tasks, project management, or anything else you need help with.
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: msg.isUser ? theme.palette.primary.main : theme.palette.secondary.main,
                    width: 32,
                    height: 32
                  }}
                >
                  {msg.isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                </Avatar>
                
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: msg.isUser 
                      ? theme.palette.primary.light 
                      : theme.palette.background.default,
                    color: msg.isUser 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.primary,
                    position: 'relative',
                    '&::after': msg.isUser ? {
                      content: '""',
                      position: 'absolute',
                      right: -8,
                      top: 10,
                      border: '8px solid transparent',
                      borderLeftColor: msg.isUser ? theme.palette.primary.light : 'transparent'
                    } : {},
                    '&::before': !msg.isUser ? {
                      content: '""',
                      position: 'absolute',
                      left: -8,
                      top: 10,
                      border: '8px solid transparent',
                      borderRightColor: !msg.isUser ? theme.palette.background.default : 'transparent'
                    } : {}
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      textAlign: 'right',
                      opacity: 0.7 
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 1,
              mt: 1
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.secondary.main,
                width: 32,
                height: 32
              }}
            >
              <BotIcon fontSize="small" />
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: theme.palette.background.default
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} thickness={6} />
                <Typography variant="body2">AI is thinking...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              m: 2,
              borderRadius: 1,
              bgcolor: theme.palette.error.light,
              color: theme.palette.error.contrastText
            }}
          >
            <ErrorIcon sx={{ mr: 1 }} />
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </Box>

      <Divider />
      
      {/* Message input form */}
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        sx={{
          display: 'flex',
          p: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message to the AI..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          size="small"
          sx={{ mr: 1 }}
          InputProps={{
            sx: {
              borderRadius: 4
            }
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={isLoading || !inputText.trim()}
          sx={{ 
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatBot;