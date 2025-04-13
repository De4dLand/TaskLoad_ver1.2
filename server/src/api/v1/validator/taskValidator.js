import Joi from 'joi';

export const validateTask = Joi.object({
  title: Joi.string()
    .required()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  status: Joi.string()
    .valid('todo', 'in_progress', 'review', 'completed')
    .default('todo')
    .messages({
      'any.only': 'Invalid status value'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Invalid priority value'
    }),
  dueDate: Joi.date()
    .min('now')
    .messages({
      'date.base': 'Invalid date format',
      'date.min': 'Due date cannot be in the past'
    }),
  project: Joi.string()
    .required()
    .messages({
      'string.empty': 'Project ID cannot be empty',
      'any.required': 'Project ID is required'
    }),
  assignedTo: Joi.string()
    .allow('')
    .messages({
      'string.empty': 'Assigned user ID cannot be empty'
    }),
  createdBy: Joi.string()
    .required()
    .messages({
      'string.empty': 'Creator ID cannot be empty',
      'any.required': 'Creator ID is required'
    }),
  tags: Joi.array()
    .items(Joi.string())
    .messages({
      'array.base': 'Tags must be an array'
    }),
  estimatedHours: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Estimated hours must be a number',
      'number.min': 'Estimated hours cannot be negative'
    }),
  actualHours: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Actual hours must be a number',
      'number.min': 'Actual hours cannot be negative'
    }),
  dependencies: Joi.array()
    .items(Joi.string())
    .messages({
      'array.base': 'Dependencies must be an array'
    }),
  subtasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        completed: Joi.boolean().default(false)
      })
    )
    .messages({
      'array.base': 'Subtasks must be an array'
    }),
  customFields: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.any()
      })
    )
    .messages({
      'array.base': 'Custom fields must be an array'
    })
});

export const validateTaskUpdate = validateTask.fork(
  ['title', 'project', 'createdBy'],
  schema => schema.optional()
);

export const validateTaskStatus = Joi.object({
  status: Joi.string()
    .valid('todo', 'in_progress', 'review', 'completed')
    .required()
    .messages({
      'any.only': 'Invalid status value',
      'any.required': 'Status is required'
    })
});

export const validateTaskPriority = Joi.object({
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .required()
    .messages({
      'any.only': 'Invalid priority value',
      'any.required': 'Priority is required'
    })
});

export const validateTaskDueDate = Joi.object({
  dueDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.base': 'Invalid date format',
      'date.min': 'Due date cannot be in the past',
      'any.required': 'Due date is required'
    })
});

export const validateTaskAssignment = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'string.empty': 'User ID cannot be empty',
      'any.required': 'User ID is required'
    })
});

export const validateTaskComment = Joi.object({
  content: Joi.string()
    .required()
    .min(1)
    .max(1000)
    .messages({
      'string.empty': 'Comment cannot be empty',
      'string.min': 'Comment must be at least 1 character long',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment is required'
    })
});

export const validateTaskAttachment = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'string.empty': 'File name cannot be empty',
      'any.required': 'File name is required'
    }),
  url: Joi.string()
    .required()
    .uri()
    .messages({
      'string.empty': 'File URL cannot be empty',
      'string.uri': 'Invalid file URL',
      'any.required': 'File URL is required'
    }),
  type: Joi.string()
    .required()
    .messages({
      'string.empty': 'File type cannot be empty',
      'any.required': 'File type is required'
    }),
  size: Joi.number()
    .required()
    .min(0)
    .messages({
      'number.base': 'File size must be a number',
      'number.min': 'File size cannot be negative',
      'any.required': 'File size is required'
    })
});

