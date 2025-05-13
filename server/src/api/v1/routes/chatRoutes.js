import express from 'express';
import { verifyToken } from '../../../middlewares/auth.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  getChatRooms,
  getChatRoomById,
  getChatMessages,
  createChatRoom,
  sendMessage,
  markMessagesAsRead
} from '../controllers/chatController.js';
import {
  createChatRoomValidator,
  getChatRoomValidator,
  getChatMessagesValidator,
  sendMessageValidator,
  markMessagesAsReadValidator
} from '../validator/chatValidator.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(verifyToken);

// Get all chat rooms for the current user
router.get('/', getChatRooms);

// Create a new chat room
router.post('/', createChatRoomValidator, validate, createChatRoom);

// Get a specific chat room by ID
router.get('/:roomId', getChatRoomValidator, validate, getChatRoomById);

// Get messages for a specific chat room
router.get('/:roomId/messages', getChatMessagesValidator, validate, getChatMessages);

// Send a message to a chat room
router.post('/:roomId/messages', sendMessageValidator, validate, sendMessage);

// Mark messages as read
router.post('/:roomId/read', markMessagesAsReadValidator, validate, markMessagesAsRead);

export default router;