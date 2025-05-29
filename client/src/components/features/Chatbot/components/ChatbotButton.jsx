import React, { useContext, useState } from 'react';
import { Fab, Tooltip, Zoom, Badge, useTheme } from '@mui/material';
import { SmartToy as SmartToyIcon } from '@mui/icons-material';
import { AuthContext } from '../../../../contexts/AuthContext';
import ChatbotDialog from './ChatbotDialog';
import styles from './ChatbotDialog.module.css';

/**
 * ChatbotButton component
 * A standalone button that can be placed anywhere in the app to access the AI assistant
 * Includes the dialog component that appears when clicked
 */
const ChatbotButton = () => {
  const { currentUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState(false); // For future notification badge
  const theme = useTheme();

  const handleToggleDialog = () => {
    setOpen(prevOpen => !prevOpen);
    if (newMessage) setNewMessage(false); // Clear notification when opening
  };

  return (
    <>
      {/* Floating action button to open the chatbot */}
      <Tooltip title="AI Assistant" placement="left" TransitionComponent={Zoom}>
        <Fab 
          color="primary" 
          aria-label="chat"
          onClick={handleToggleDialog}
          className={styles.fabButton}
          sx={{
            boxShadow: theme.shadows[8],
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            animation: open ? 'none' : `${newMessage ? 'pulse 1.5s infinite' : 'none'}`,
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)'
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
              }
            }
          }}
        >
          <Badge color="error" variant="dot" invisible={!newMessage}>
            <SmartToyIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Chatbot dialog that appears when button is clicked */}
      {open && (
        <ChatbotDialog 
          currentUser={currentUser} 
          onClose={() => setOpen(false)} 
        />
      )}
    </>
  );
};

export default ChatbotButton;
