import { body } from 'express-validator';

export const validateTask = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional({ nullable: true })
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'completed']).withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom(value => new Date(value) >= new Date()).withMessage('Due date cannot be in the past'),
  body('project')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Project ID must be a valid ID'),
  body('assignedTo')
    .optional({ nullable: true })
    .custom(value => value === null || typeof value === 'undefined' || /^[a-fA-F0-9]{24}$/.test(value))
    .withMessage('Assigned user ID must be a valid ID or null'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .isString().withMessage('Each tag must be a string'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated hours must be a non-negative number'),
];

export const validateTaskUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional({ nullable: true })
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'completed']).withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom(value => new Date(value) >= new Date()).withMessage('Due date cannot be in the past'),
  body('project')
    .optional()
    .isMongoId().withMessage('Project ID must be a valid ID'),
  body('assignedTo')
    .optional({ nullable: true })
    .custom(value => value === null || typeof value === 'undefined' || /^[a-fA-F0-9]{24}$/.test(value))
    .withMessage('Assigned user ID must be a valid ID or null'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .isString().withMessage('Each tag must be a string'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }).withMessage('Estimated hours must be a non-negative number'),
];

export const validateTaskStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['todo', 'in_progress', 'review', 'completed']).withMessage('Invalid status value'),
];

export const validateTaskPriority = [
  body('priority')
    .notEmpty().withMessage('Priority is required')
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
];

export const validateTaskDueDate = [
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom(value => new Date(value) >= new Date()).withMessage('Due date cannot be in the past'),
];

export const validateTaskAssignment = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('User ID must be a valid ID'),
];

export const validateTaskComment = [
  body('content')
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
];

export const validateTaskAttachment = [
  body('name')
    .notEmpty().withMessage('File name is required'),
  body('url')
    .notEmpty().withMessage('File URL is required')
    .isURL().withMessage('Invalid file URL'),
  body('type')
    .notEmpty().withMessage('File type is required'),
  body('size')
    .notEmpty().withMessage('File size is required')
    .isFloat({ min: 0 }).withMessage('File size must be a non-negative number'),
];
