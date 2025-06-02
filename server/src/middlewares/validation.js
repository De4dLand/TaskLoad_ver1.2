import mongoose from 'mongoose'

/**
 * Middleware to validate MongoDB ObjectId parameters
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware function
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName]
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} parameter is required`
      })
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      })
    }
    
    next()
  }
}

/**
 * Middleware to validate multiple ObjectId parameters
 * @param {Array<string>} paramNames - Array of parameter names to validate
 * @returns {Function} Express middleware function
 */
export const validateObjectIds = (paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName]
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: `${paramName} parameter is required`
        })
      }
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${paramName} format`
        })
      }
    }
    
    next()
  }
}

/**
 * Middleware to validate request body fields
 * @param {Object} schema - Validation schema object
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = []
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]
      
      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
        continue
      }
      
      // Skip validation if field is not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`)
        continue
      }
      
      // String length validation
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`)
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} cannot exceed ${rules.maxLength} characters`)
        }
      }
      
      // Number range validation
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`)
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} cannot exceed ${rules.max}`)
        }
      }
      
      // Array validation
      if (rules.type === 'array' && Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`)
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${field} cannot have more than ${rules.maxItems} items`)
        }
      }
      
      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value)
        if (customError) {
          errors.push(customError)
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      })
    }
    
    next()
  }
}

/**
 * Middleware to validate time format (HH:MM)
 * @param {string} fieldName - Name of the field to validate
 * @returns {Function} Express middleware function
 */
export const validateTimeFormat = (fieldName) => {
  return (req, res, next) => {
    const timeValue = req.body[fieldName]
    
    if (timeValue && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be in HH:MM format (24-hour)`
      })
    }
    
    next()
  }
}

/**
 * Middleware to validate date format
 * @param {string} fieldName - Name of the field to validate
 * @returns {Function} Express middleware function
 */
export const validateDateFormat = (fieldName) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName]
    
    if (dateValue) {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} must be a valid date`
        })
      }
    }
    
    next()
  }
}