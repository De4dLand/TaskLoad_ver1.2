import { validationResult } from "express-validator"
import { createError } from "../utils/error.js"
import logger from "../utils/logger.js"

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Middleware function
 */
export const validateRequest = (validations) => {
    return async (req, res, next) => {
        try {
            // Run all validations
            await Promise.all(validations.map((validation) => validation.run(req)))

            // Check for validation errors
            const errors = validationResult(req)

            if (errors.isEmpty()) {
                return next()
            }

            // Format validation errors
            const formattedErrors = {}

            errors.array().forEach((error) => {
                formattedErrors[error.path] = formattedErrors[error.path]
                    ? `${formattedErrors[error.path]}, ${error.msg}`
                    : error.msg
            })

            // Log validation errors
            logger.debug("Request validation failed", {
                path: req.path,
                method: req.method,
                errors: formattedErrors,
            })

            // Return validation error response
            return next(createError(400, "Validation failed", formattedErrors))
        } catch (error) {
            logger.error("Error in validation middleware", { error: error.message })
            return next(createError(500, "Internal server error during validation"))
        }
    }
}

/**
 * Middleware to validate request ID parameters
 * @param {string} paramName - Name of the ID parameter
 * @returns {Function} Middleware function
 */
export const validateIdParam = (paramName = "id") => {
    return (req, res, next) => {
        const id = req.params[paramName]

        // Check if ID is a valid MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return next(createError(400, `Invalid ${paramName} parameter`))
        }

        next()
    }
}

/**
 * Middleware to sanitize request body
 * @returns {Function} Middleware function
 */
export const sanitizeBody = () => {
    return (req, res, next) => {
        if (req.body) {
            // Remove any properties that start with $ or contain .
            // These could be used for MongoDB operator injection
            const sanitizedBody = {}

            for (const [key, value] of Object.entries(req.body)) {
                if (!key.startsWith("$") && !key.includes(".")) {
                    sanitizedBody[key] = value
                }
            }

            req.body = sanitizedBody
        }

        next()
    }
}
