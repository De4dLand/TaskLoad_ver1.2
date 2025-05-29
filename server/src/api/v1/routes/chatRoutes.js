import express from 'express';
import auth from '../../../middlewares/auth.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { checkChatAccess } from '../../../utils/permissionMiddleware.js';
import chatController from '../controllers/chatController.js';
import {
  createChatRoomValidator,
  getChatRoomValidator,
  getChatMessagesValidator,
  sendMessageValidator,
  markMessagesAsReadValidator
} from '../validator/chatValidator.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(auth.verifyToken);

// Get all chat rooms for the current user
router.get('/', chatController.getChatRooms);

// Create a new chat room
router.post('/', createChatRoomValidator, validate, chatController.createChatRoom);

// Get a specific chat room by ID
router.get('/:roomId', getChatRoomValidator, validate, checkChatAccess(), chatController.getChatRoomById);

// Get messages for a specific chat room
router.get('/:roomId/messages', getChatMessagesValidator, validate, checkChatAccess(), chatController.getChatMessages);

// Send a message to a chat room
router.post('/:roomId/messages', sendMessageValidator, validate, checkChatAccess(), chatController.sendMessage);

// Mark messages as read
router.post('/:roomId/read', markMessagesAsReadValidator, validate, checkChatAccess(), chatController.markMessagesAsRead);

export default router;