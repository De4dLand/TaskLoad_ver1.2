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
 */
// Key for localStorage
const CHAT_STORAGE_KEY = 'taskload_chat_history';

const clearChat = () => {
  const messages = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }
  return messages;
};

const ChatBot = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      return savedMessages ? JSON.parse(savedMessages) : clearChat();
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCpWGM4YgvBosMZnHP7onfyeln-2sfh45E';
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // System prompt for the AI assistant
  const systemPrompt = `Bạn là một trợ lý ảo thân thiện và chuyên nghiệp tên là TaskLoad AI. Hãy tuân thủ các quy tắc sau:
  1. Trả lời bằng tiếng Việt với giọng văn thân thiện, gần gũi
  2. Sử dụng đại từ "mình" khi nói về bản thân và "bạn" khi nói với người dùng
  3. Giọng văn lịch sự, tôn trọng nhưng vẫn tự nhiên như đang trò chuyện
  4. Luôn giữ thái độ tích cực và hỗ trợ nhiệt tình
  5. Nếu không hiểu câu hỏi, hãy lịch sự yêu cầu làm rõ
  6. Đưa ra câu trả lời ngắn gọn, rõ ràng và dễ hiểu
  7. Sử dụng các biểu tượng cảm xúc phù hợp để tăng tính thân thiện
  8. Khi cần, đặt câu hỏi ngược lại để hiểu rõ hơn về nhu cầu của người dùng
  9. Không đưa ra thông tin nhạy cảm hoặc không phù hợp
  10. Kết thúc câu trả lời bằng một câu hỏi hoặc gợi ý để tiếp tục cuộc trò chuyện`;

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
        { text: "Xin lỗi, có lỗi xảy ra khi kết nối với hệ thống. Vui lòng thử lại sau.", isUser: false, timestamp: new Date().toISOString() }
      ]);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-04-17",
        
      });

      // Combine system prompt with chat history
      const chatHistory = [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Xin chào! Mình là TaskLoad AI, trợ lý ảo của bạn. Mình có thể giúp gì cho bạn hôm nay? 😊" }],
        },
        ...messages.slice(-6).map(msg => ({
          role: msg.isUser ? "user" : "model",
          parts: [{ text: msg.text }]
        }))
      ];

      // Format message history for Gemini
      const chat = model.startChat({
        history: chatHistory,
      });

      // Send message to Gemini with Vietnamese language preference
      const prompt = `${inputText}\n\nHãy trả lời bằng tiếng Việt với giọng văn thân thiện và chuyên nghiệp.`;
      const result = await chat.sendMessage(prompt);
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
               Xin  chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?
            </Typography>
            <Typography variant="body2" align="center" sx={{ mt: 1, color: theme.palette.text.secondary }}>
               Hãy hỏi tôi về các nhiệm vụ, quản lý dự án, hoặc bất cứ điều gì bạn cần giúp đỡ.
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
                <Typography variant="body2">AI đang suy nghĩ...</Typography>
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
          placeholder="Nhập tin nhắn..."
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