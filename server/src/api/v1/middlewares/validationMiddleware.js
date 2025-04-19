/**
 * Middleware factory for request validation using Joi schemas or express-validator chains
 * @param {Object|Array} schema - Joi validation schema or express-validator chain
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function|Array} Express middleware function or array of middleware functions
 */
import { validationResult } from 'express-validator';

export const validate = (schema, property = 'body') => {
  // If schema is an array of express-validator middlewares
  if (Array.isArray(schema)) {
    return [
      ...schema,
      (req, res, next) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
        const formatted = errors.array().map(err => ({ field: err.param, message: err.msg }));
        return res.status(400).json({ status: 'error', message: 'Validation failed', errors: formatted });
      }
    ];
  }
  // Fallback to Joi schema validation
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (!error) {
      return next();
    }

    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  };
};
