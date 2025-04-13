import Joi from 'joi';

// Validate team creation
export const validateTeam = Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
        'string.empty': 'Tên team không được để trống',
        'string.min': 'Tên team phải có ít nhất 2 ký tự',
        'string.max': 'Tên team không được vượt quá 50 ký tự',
        'any.required': 'Tên team là bắt buộc'
    }),
    description: Joi.string().allow('').max(500).messages({
        'string.max': 'Mô tả không được vượt quá 500 ký tự'
    }),
    status: Joi.string().valid('active', 'inactive', 'archived').default('active').messages({
        'any.only': 'Trạng thái không hợp lệ'
    }),
    members: Joi.array().items(Joi.string()).messages({
        'array.base': 'Danh sách thành viên phải là một mảng'
    }),
    projects: Joi.array().items(Joi.string()).messages({
        'array.base': 'Danh sách dự án phải là một mảng'
    }),
    customFields: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            value: Joi.any()
        })
    ).messages({
        'array.base': 'Custom fields phải là một mảng'
    })
});

// Validate team update
export const validateTeamUpdate = Joi.object({
    name: Joi.string().min(2).max(50).messages({
        'string.min': 'Tên team phải có ít nhất 2 ký tự',
        'string.max': 'Tên team không được vượt quá 50 ký tự'
    }),
    description: Joi.string().allow('').max(500).messages({
        'string.max': 'Mô tả không được vượt quá 500 ký tự'
    }),
    status: Joi.string().valid('active', 'inactive', 'archived').messages({
        'any.only': 'Trạng thái không hợp lệ'
    }),
    members: Joi.array().items(Joi.string()).messages({
        'array.base': 'Danh sách thành viên phải là một mảng'
    }),
    projects: Joi.array().items(Joi.string()).messages({
        'array.base': 'Danh sách dự án phải là một mảng'
    }),
    customFields: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            value: Joi.any()
        })
    ).messages({
        'array.base': 'Custom fields phải là một mảng'
    })
});

// Validate team member
export const validateTeamMember = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'ID người dùng không được để trống',
        'any.required': 'ID người dùng là bắt buộc'
    })
});

// Validate team project
export const validateTeamProject = Joi.object({
    projectId: Joi.string().required().messages({
        'string.empty': 'ID dự án không được để trống',
        'any.required': 'ID dự án là bắt buộc'
    })
});

// Validate team custom fields
export const validateTeamCustomFields = Joi.array().items(
    Joi.object({
        name: Joi.string().required().messages({
            'string.empty': 'Tên custom field không được để trống',
            'any.required': 'Tên custom field là bắt buộc'
        }),
        value: Joi.any()
    })
).messages({
    'array.base': 'Custom fields phải là một mảng'
}); 