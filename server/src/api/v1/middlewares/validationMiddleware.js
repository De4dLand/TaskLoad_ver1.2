/**
 * Middleware factory for request validation using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
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
