import Chat from '../../../models/Chat.js';
import { createError } from '../../../utils/error.js';

/**
 * Controller for chat-related API endpoints
 */
export const getChatRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find all chat rooms where the user is a participant
    const chatRooms = await Chat.find({ participants: userId })
      .sort({ lastActivity: -1 })
      .populate('participants', 'name email avatar')
      .select('-messages');
    
    res.status(200).json({
      status: 'success',
      results: chatRooms.length,
      data: chatRooms
    });
  } catch (error) {
    next(error);
  }
};

export const getChatRoomById = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    
    // Find the chat room and verify user is a participant
    const chatRoom = await Chat.findOne({
      roomId,
      participants: userId
    }).populate('participants', 'name email avatar');
    
    if (!chatRoom) {
      return next(createError(404, 'Chat room not found or you do not have access'));
    }
    
    res.status(200).json({
      status: 'success',
      data: chatRoom
    });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    const { limit = 50, before } = req.query;
    
    // Find the chat room and verify user is a participant
    const chatRoom = await Chat.findOne({
      roomId,
      participants: userId
    });
    
    if (!chatRoom) {
      return next(createError(404, 'Chat room not found or you do not have access'));
    }
    
    // Filter messages by timestamp if 'before' parameter is provided
    let messages = chatRoom.messages;
    if (before) {
      const beforeDate = new Date(before);
      messages = messages.filter(msg => msg.timestamp < beforeDate);
    }
    
    // Sort messages by timestamp (newest first) and limit results
    messages = messages.sort((a, b) => b.timestamp - a.timestamp).slice(0, parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

export const createChatRoom = async (req, res, next) => {
  try {
    const { type, participants, name } = req.body;
    const userId = req.user._id;
    
    // Ensure current user is included in participants
    if (!participants.includes(userId.toString())) {
      participants.push(userId);
    }
    
    // For direct chats, check if a chat already exists between these users
    if (type === 'direct' && participants.length === 2) {
      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: { $all: participants, $size: 2 }
      });
      
      if (existingChat) {
        return res.status(200).json({
          status: 'success',
          data: existingChat
        });
      }
    }
    
    // Create a new chat room
    const newChatRoom = new Chat({
      roomId: `${type}_${Date.now()}`,
      type,
      participants,
      metadata: { name }
    });
    
    await newChatRoom.save();
    
    res.status(201).json({
      status: 'success',
      data: newChatRoom
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    
    // Find the chat room and verify user is a participant
    const chatRoom = await Chat.findOne({
      roomId,
      participants: userId
    });
    
    if (!chatRoom) {
      return next(createError(404, 'Chat room not found or you do not have access'));
    }
    
    // Create and add the message
    const message = {
      sender: userId,
      content,
      timestamp: new Date(),
      read: [userId] // Mark as read by sender
    };
    
    chatRoom.messages.push(message);
    chatRoom.lastActivity = new Date();
    await chatRoom.save();
    
    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;
    
    // Find the chat room and verify user is a participant
    const chatRoom = await Chat.findOne({
      roomId,
      participants: userId
    });
    
    if (!chatRoom) {
      return next(createError(404, 'Chat room not found or you do not have access'));
    }
    
    // Update read status for each message
    let updated = false;
    chatRoom.messages.forEach(message => {
      if (messageIds.includes(message._id.toString()) && !message.read.includes(userId)) {
        message.read.push(userId);
        updated = true;
      }
    });
    
    if (updated) {
      await chatRoom.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};