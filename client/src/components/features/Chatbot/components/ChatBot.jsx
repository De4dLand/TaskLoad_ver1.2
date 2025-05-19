import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import styles from './ChatInterface.module.css';

/**
 * ChatBot component provides an AI chat interface using Google's Gemini API
 * Includes message history, input area, and loading states
 */
const ChatBot = ({ userId }) => {
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
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>AI Assistant</h3>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      <div className={styles.messagesContainer} ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.messageItem} ${msg.isUser ? styles.ownMessage : styles.aiMessage}`}
            >
              <div className={styles.messageSender}>{msg.isUser ? 'You' : 'AI Assistant'}</div>
              <div className={styles.messageContent}>{msg.text}</div>
              <div className={styles.messageTime}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.typingIndicator}>AI is thinking...</div>
          </div>
        )}
      </div>

      <form className={styles.messageInputForm} onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to the AI..."
          className={styles.messageInput}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={styles.sendButton} 
          disabled={isLoading || !inputText.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBot;