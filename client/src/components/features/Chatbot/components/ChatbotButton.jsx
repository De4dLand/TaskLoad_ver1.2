import React, { useState } from 'react';
import { Fab, Tooltip, Zoom, Badge, useTheme, Avatar, Box } from '@mui/material';
import { SmartToy as SmartToyIcon } from '@mui/icons-material';

import ChatbotDialog from './ChatbotDialog';
import styles from './ChatbotDialog.module.css';

/**
 * ChatbotButton component
 * A standalone button that can be placed anywhere in the app to access the AI assistant
 * Includes the dialog component that appears when clicked
 */
const ChatbotButton = () => {

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
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: theme.zIndex.speedDial
        }}
      >
        <Tooltip title="AI Assistant" placement="left" TransitionComponent={Zoom}>
          <Fab 
            color="primary" 
            aria-label="chat"
            onClick={handleToggleDialog}
            className={styles.fabButton}
            sx={{
              width: 60,
              height: 60,
              boxShadow: theme.shadows[8],
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease-in-out',
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
            <Badge color="error" variant="dot" overlap="circular" invisible={!newMessage}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 56, 
                  height: 56,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    transition: 'transform 0.2s ease-in-out',
                  }
                }}
              >
                <SmartToyIcon fontSize="large" sx={{ color: 'white' }} />
              </Avatar>
            </Badge>
          </Fab>
        </Tooltip>
      </Box>

      {/* Chatbot dialog that appears when button is clicked */}
      {open && (
        <ChatbotDialog onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default ChatbotButton;
