import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Validation rules for chat-related API endpoints
 */
export const createChatRoomValidator = [
  body('type')
    .isIn(['direct', 'group', 'project', 'task'])
    .withMessage('Chat type must be one of: direct, group, project, task'),
  
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  
  body('participants.*')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid participant ID format'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat name must be between 1 and 100 characters')
];

export const getChatRoomValidator = [
  param('roomId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Room ID is required')
];

export const getChatMessagesValidator = [
  param('roomId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Room ID is required'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('before')
    .optional()
    .isISO8601()
    .withMessage('Before must be a valid ISO date')
];

export const sendMessageValidator = [
  param('roomId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Room ID is required'),
  
  body('content')
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 5000 })
    .withMessage('Message content is required and must be less than 5000 characters')
];

export const markMessagesAsReadValidator = [
  param('roomId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Room ID is required'),
  
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('At least one message ID is required'),
  
  body('messageIds.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Invalid message ID format')
];