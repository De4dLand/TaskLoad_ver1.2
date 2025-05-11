import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Avatar, Paper, Divider, IconButton, CircularProgress } from '@mui/material';
import { Send as SendIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import { getSocket, joinRoom, leaveRoom } from '../../../../../services/socket';
import useAuth from '../../../../../hooks/useAuth';
import styles from './ProjectChat.module.css';

/**
 * ProjectChat component for real-time project member communication
 * @param {Object} props - Component props
 * @param {Object} props.project - Current project object
 * @param {Array} props.members - Project members
 */
const ProjectChat = ({ project, members }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Connect to socket and load chat history when component mounts
  useEffect(() => {
    if (!project || !user) return;

    const projectRoomId = `project:${project._id}`;
    const chatRoomId = `chat:${projectRoomId}`;
    
    // Initialize socket connection
    socketRef.current = getSocket(user);
    const socket = socketRef.current;

    // Join the project chat room
    joinRoom(projectRoomId);
    socket.emit('chat:join', { roomId: projectRoomId });

    // Load chat history
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/project/${project._id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load chat history');
        }
        
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error loading chat history:', err);
        setError('Failed to load chat messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();

    // Set up event listeners
    socket.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('chat:typing', ({ userId, isTyping }) => {
      if (userId === user._id) return; // Ignore own typing events
      
      setTypingUsers(prev => {
        if (isTyping && !prev.includes(userId)) {
          return [...prev, userId];
        } else if (!isTyping && prev.includes(userId)) {
          return prev.filter(id => id !== userId);
        }
        return prev;
      });
    });

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.off('chat:message');
        socket.off('chat:typing');
        socket.emit('chat:leave', { roomId: projectRoomId });
        leaveRoom(projectRoomId);
      }
    };
  }, [project, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !project || !user) return;

    const messageData = {
      roomId: `project:${project._id}`,
      message: {
        content: newMessage.trim(),
        sender: user._id,
        timestamp: new Date(),
        read: [user._id]
      },
      sender: user._id
    };

    // Emit message to server
    socketRef.current.emit('chat:message', messageData);
    setNewMessage('');
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      socketRef.current.emit('chat:typing', {
        roomId: `project:${project._id}`,
        userId: user._id,
        isTyping: false
      });
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socketRef.current || !project || !user) return;
    
    // Send typing indicator
    socketRef.current.emit('chat:typing', {
      roomId: `project:${project._id}`,
      userId: user._id,
      isTyping: true
    });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('chat:typing', {
          roomId: `project:${project._id}`,
          userId: user._id,
          isTyping: false
        });
      }
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Find member name by ID
  const getMemberName = (userId) => {
    const member = members?.find(m => m.user._id === userId || m._id === userId);
    return member ? (member.user?.name || member.name || 'Unknown User') : 'Unknown User';
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box className={styles.chatContainer}>
      <Typography variant="h6" className={styles.chatHeader}>
        Project Chat
      </Typography>
      <Divider />
      
      <Box className={styles.messagesContainer}>
        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress size={24} />
            <Typography variant="body2">Loading messages...</Typography>
          </Box>
        ) : error ? (
          <Box className={styles.errorContainer}>
            <Typography color="error">{error}</Typography>
            <Button variant="outlined" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Box>
        ) : messages.length === 0 ? (
          <Box className={styles.emptyContainer}>
            <Typography variant="body2" color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box 
              key={index}
              className={`${styles.messageItem} ${msg.sender === user._id ? styles.ownMessage : ''}`}
            >
              {msg.sender !== user._id && (
                <Avatar className={styles.avatar} alt={getMemberName(msg.sender)} src="" />
              )}
              <Box className={styles.messageContent}>
                {msg.sender !== user._id && (
                  <Typography variant="caption" className={styles.senderName}>
                    {getMemberName(msg.sender)}
                  </Typography>
                )}
                <Paper className={styles.messageBubble}>
                  <Typography variant="body2">{msg.content}</Typography>
                </Paper>
                <Typography variant="caption" className={styles.timestamp}>
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        
        {typingUsers.length > 0 && (
          <Box className={styles.typingIndicator}>
            <Typography variant="caption">
              {typingUsers.map(userId => getMemberName(userId)).join(', ')} 
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <Box className={styles.inputContainer}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={!project}
          InputProps={{
            endAdornment: (
              <IconButton color="primary" onClick={() => {/* Emoji picker implementation */}}>
                <EmojiIcon />
              </IconButton>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !project}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ProjectChat;