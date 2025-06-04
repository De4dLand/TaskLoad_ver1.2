import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box,
  Fab,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { 
  Close as CloseIcon, 
  SmartToy as SmartToyIcon,
  Minimize as MinimizeIcon,
  OpenInFull as OpenInFullIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import ChatBot from './ChatBot';
import styles from './ChatbotDialog.module.css';
import { ChatProvider } from '../contexts/ChatContext';

/**
 * ChatbotDialog component
 * Provides a dialog-based interface for the AI chatbot that can be toggled with a button
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - Current user object
 * @param {Function} props.onClose - Function to call when dialog is closed
 */
const ChatbotDialog = ({ onClose }) => {
  const [minimized, setMinimized] = useState(false);
  const [open, setOpen] = useState(true);
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const handleMinimize = () => {
    setMinimized(!minimized);
  };

  const defaultRoomId = 'ai-assistant';

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        className={styles.chatbotDialog}
        PaperProps={{
          className: styles.dialogPaper,
          style: {
            maxHeight: minimized ? '80px' : '600px',
            transition: 'max-height 0.3s ease-in-out',
            borderColor: theme.palette.primary.main
          }
        }}
      >
        <DialogTitle className={styles.dialogTitle} sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: theme.palette.primary.contrastText,
          p: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToyIcon sx={{ mr: 1 }} />
            {!minimized && (
              <Typography variant="h6" component="span">
                Trợ lý AI
              </Typography>
            )}
          </Box>
          <Box>
            <Tooltip title={minimized ? "Expand" : "Minimize"}>
              <IconButton 
                onClick={handleMinimize} 
                size="small"
                sx={{ color: theme.palette.primary.contrastText }}
              >
                {minimized ? <OpenInFullIcon /> : <MinimizeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton 
                onClick={handleClose} 
                size="small"
                sx={{ color: theme.palette.primary.contrastText }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        {!minimized && (
          <DialogContent className={styles.dialogContent}>
            <ChatProvider>
              <ChatBot />
            </ChatProvider>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default ChatbotDialog;
