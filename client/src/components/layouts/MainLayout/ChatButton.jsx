import { useState } from 'react';
import { Fab, Tooltip, Zoom } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ChatButton = () => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  
  const handleChatOpen = () => {
    navigate('/chatbot');
  };

  return (
    <Tooltip
      title="Open Chatbot"
      placement="left"
      TransitionComponent={Zoom}
      open={hover}
    >
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleChatOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          backgroundColor: '#1a56db',
          '&:hover': {
            backgroundColor: '#1649c0',
          },
        }}
      >
        <ChatIcon />
      </Fab>
    </Tooltip>
  );
};

export default ChatButton;