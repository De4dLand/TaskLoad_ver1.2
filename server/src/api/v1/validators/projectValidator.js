import Joi from 'joi';

export const validateProject = Joi.object({
    name: Joi.string()
        .required()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Project name cannot be empty',
            'string.min': 'Project name must be at least 1 character long',
            'string.max': 'Project name cannot exceed 100 characters',
            'any.required': 'Project name is required'
        }),
    description: Joi.string()
        .allow('')
        .max(500)
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
    status: Joi.string()
        .valid('planning', 'active', 'on_hold', 'completed', 'cancelled')
        .default('planning')
        .messages({
            'any.only': 'Invalid status value'
        }),
    startDate: Joi.date()
        .required()
        .messages({
            'date.base': 'Invalid date format',
            'any.required': 'Start date is required'
        }),
    endDate: Joi.date()
        .required()
        .min(Joi.ref('startDate'))
        .messages({
            'date.base': 'Invalid date format',
            'date.min': 'End date must be after start date',
            'any.required': 'End date is required'
        }),
    team: Joi.string()
        .required()
        .messages({
            'string.empty': 'Team ID cannot be empty',
            'any.required': 'Team ID is required'
        }),
    leader: Joi.string()
        .required()
        .messages({
            'string.empty': 'Leader ID cannot be empty',
            'any.required': 'Leader ID is required'
        }),
    members: Joi.array()
        .items(Joi.string())
        .messages({
            'array.base': 'Members must be an array'
        }),
    tags: Joi.array()
        .items(Joi.string())
        .messages({
            'array.base': 'Tags must be an array'
        }),
    budget: Joi.object({
        estimated: Joi.number()
            .min(0)
            .messages({
                'number.base': 'Estimated budget must be a number',
                'number.min': 'Estimated budget cannot be negative'
            }),
        actual: Joi.number()
            .min(0)
            .messages({
                'number.base': 'Actual budget must be a number',
                'number.min': 'Actual budget cannot be negative'
            })
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

export const validateProjectUpdate = validateProject.fork(
    ['name', 'team', 'leader'],
    schema => schema.optional()
);

export const validateProjectStatus = Joi.object({
    status: Joi.string()
        .valid('planning', 'active', 'on_hold', 'completed', 'cancelled')
        .required()
        .messages({
            'any.only': 'Invalid status value',
            'any.required': 'Status is required'
        })
});

export const validateProjectMember = Joi.object({
    userId: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID cannot be empty',
            'any.required': 'User ID is required'
        })
});

export const validateProjectTask = Joi.object({
    taskId: Joi.string()
        .required()
        .messages({
            'string.empty': 'Task ID cannot be empty',
            'any.required': 'Task ID is required'
        })
});

export const validateProjectBudget = Joi.object({
    estimated: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Estimated budget must be a number',
            'number.min': 'Estimated budget cannot be negative'
        }),
    actual: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Actual budget must be a number',
            'number.min': 'Actual budget cannot be negative'
        })
});

export const validateProjectCustomFields = Joi.array()
    .items(
        Joi.object({
            name: Joi.string().required(),
            value: Joi.any()
        })
    )
    .messages({
        'array.base': 'Custom fields must be an array'
    }); 