import React, { useState, useEffect } from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useChatSocket } from '../hooks';
import ChatInterface from './ChatInterface';
import styles from './ChatRoom.module.css';

/**
 * ChatRoom component that integrates the chat context and socket functionality
 * Provides room selection and the chat interface
 */
const ChatRoom = ({ currentUser }) => {
  const { chatRooms, currentRoomId, switchRoom, createRoom, isLoading: roomsLoading } = useChatContext();
  const [newRoomName, setNewRoomName] = useState('');
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Use the chatbot socket hook to manage messages, online users, and AI-specific features
  const {
    messages,
    onlineUsers,
    isConnected,
    isLoading: messagesLoading,
    error,
    isTyping,
    sendMessage,
    sendTypingStatus,
    markAsRead
  } = useChatSocket(token, currentUser?.id, currentRoomId);

  // Handle room creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    try {
      await createRoom({
        name: newRoomName,
        participants: [currentUser.id]
      });
      setNewRoomName('');
      setShowNewRoomForm(false);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  // Handle sending messages
  const handleSendMessage = (messageText) => {
    sendMessage(messageText);
  };

  return (
    <div className={styles.chatRoomContainer}>
      <div className={styles.sidebar}>
        <div className={styles.roomsHeader}>
          <h3>Chat Rooms</h3>
          <button 
            className={styles.newRoomButton}
            onClick={() => setShowNewRoomForm(!showNewRoomForm)}
          >
            {showNewRoomForm ? 'Cancel' : '+ New'}
          </button>
        </div>
        
        {showNewRoomForm && (
          <form className={styles.newRoomForm} onSubmit={handleCreateRoom}>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className={styles.newRoomInput}
            />
            <button type="submit" className={styles.createButton}>
              Create
            </button>
          </form>
        )}
        
        {roomsLoading ? (
          <div className={styles.loading}>Loading rooms...</div>
        ) : (
          <ul className={styles.roomsList}>
            {chatRooms.map((room) => (
              <li 
                key={room._id}
                className={`${styles.roomItem} ${currentRoomId === room._id ? styles.activeRoom : ''}`}
                onClick={() => switchRoom(room._id)}
              >
                <span className={styles.roomName}>{room.name}</span>
                {room.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{room.unreadCount}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className={styles.chatArea}>
        {currentRoomId ? (
          <ChatInterface 
            currentUser={currentUser}
            roomId={currentRoomId}
          />
        ) : (
          <div className={styles.noChatSelected}>
            <p>Select a chat room or create a new one to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;