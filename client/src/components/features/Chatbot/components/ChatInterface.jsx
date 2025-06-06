import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import styles from './ChatInterface.module.css';
import { useChatSocket } from '../hooks';
import { useChatContext } from '../contexts/ChatContext';

/**
 * ChatInterface component provides the main UI for the chat functionality
 * Includes message list, input area, user presence indicators, and AI-specific features
 */
const ChatInterface = ({ currentUser, roomId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Use the chatbot socket hook with all available features
  const {
    messages,
    onlineUsers,
    isConnected,
    isLoading,
    error,
    isTyping,
    sendMessage,
    sendTypingStatus,
    markAsRead
  } = useChatSocket(token, currentUser?.id, roomId);

  // State for confirmation dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Use the clearChatData function from ChatContext
  const { clearChatData } = useChatContext();

  // Handle opening the clear chat confirmation dialog
  const handleOpenClearDialog = () => {
    setClearDialogOpen(true);
  };

  // Handle closing the clear chat confirmation dialog
  const handleCloseClearDialog = () => {
    setClearDialogOpen(false);
  };

  // Handle confirming chat data clearing
  const handleConfirmClearChat = () => {
    clearChatData();
    setClearDialogOpen(false);
  };

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    scrollToBottom();
    
    // Mark new messages as read
    const unreadMessages = messages
      .filter(msg => !msg.readBy?.includes(currentUser?.id))
      .map(msg => msg.id);
      
    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [messages, currentUser?.id, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    sendTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };
  
  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send message via socket
    sendMessage(newMessage);
    setNewMessage('');
    
    // Clear typing indicator
    sendTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleClearChat = () => {
    clearChatData();
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Chat</h3>
        <div className={styles.headerActions}>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            startIcon={<DeleteIcon />}
            onClick={handleOpenClearDialog}
            className={styles.clearButton}
          >
            Clear Chat
          </Button>
        </div>
        <div className={styles.connectionStatus}>
          {isConnected ? (
            <span className={styles.connected}>Connected</span>
          ) : (
            <span className={styles.disconnected}>Disconnected</span>
          )}
        </div>
        <div className={styles.onlineIndicators}>
          {onlineUsers.map(user => (
            <div key={user.id} className={styles.userBadge}>
              <span className={styles.onlineDot} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {isLoading ? (
          <div className={styles.loadingIndicator}>Loading messages...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`${styles.messageItem} ${msg.sender?.id === currentUser?.id ? styles.ownMessage : ''} ${msg.sender?.isAI ? styles.aiMessage : ''}`}
              >
                <div className={styles.messageSender}>{msg.sender?.name || 'AI Assistant'}</div>
                <div className={styles.messageContent}>{msg.content || msg.text}</div>
                <div className={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.readBy?.includes(currentUser?.id) && (
                    <span className={styles.readIndicator}>✓</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {Object.entries(isTyping).map(([userId, isTyping]) => {
              if (isTyping && userId !== currentUser?.id) {
                const typingUser = onlineUsers.find(user => user.id === userId) || { name: 'AI Assistant' };
                return (
                  <div key={`typing-${userId}`} className={styles.typingIndicator}>
                    {typingUser.name} is typing...
                  </div>
                );
              }
              return null;
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className={styles.messageInputForm} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message to the AI..."
          className={styles.messageInput}
          disabled={!isConnected}
        />
        <button type="submit" className={styles.sendButton} disabled={!isConnected || !newMessage.trim()}>
          Send
        </button>
      </form>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleCloseClearDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Clear Chat History
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to clear all chat history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClearChat} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
