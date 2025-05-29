import express from 'express';
import auth from '../../../middlewares/auth.js';
import { getTaskChatHistory, sendTaskChatMessage, markMessagesAsRead } from '../controllers/taskChatController.js';

const router = express.Router();

// Apply authentication middleware to all task chat routes
router.use(auth.verifyToken);

/**
 * @route GET /api/v1/tasks/:taskId/chat
 * @desc Get chat history for a task
 * @access Private
 */
router.get('/:taskId/chat', getTaskChatHistory);

/**
 * @route POST /api/v1/tasks/:taskId/chat
 * @desc Send a message to a task chat
 * @access Private
 */
router.post('/:taskId/chat', sendTaskChatMessage);

/**
 * @route PATCH /api/v1/tasks/:taskId/chat/read
 * @desc Mark messages as read in a task chat
 * @access Private
 */
router.patch('/:taskId/chat/read', markMessagesAsRead);

export default router;
