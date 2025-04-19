/**
 * Sanitize user object for safe return to client
 * Removes sensitive fields and formats data
 *
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
export const sanitizeUser = (user) => {
    if (!user) return null

    // Convert Mongoose document to plain object if needed
    const userObj = user.toObject ? user.toObject() : { ...user }

    // Remove sensitive fields
    const sensitiveFields = ["password", "passwordResetToken", "passwordResetExpires", "emailVerificationToken", "__v"]

    sensitiveFields.forEach((field) => {
        if (userObj[field] !== undefined) {
            delete userObj[field]
        }
    })

    // Ensure ID is properly formatted
    if (userObj._id && !userObj.id) {
        userObj.id = userObj._id.toString()
    }

    return userObj
}

/**
 * Sanitize error object for safe return to client
 * Removes sensitive information and formats error
 *
 * @param {Error} error - Error object
 * @returns {Object} Sanitized error object
 */
export const sanitizeError = (error) => {
    const sanitized = {
        message: error.message || "An error occurred",
        status: error.statusCode || 500,
    }

    // Include validation errors if available
    if (error.errors) {
        sanitized.errors = error.errors
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === "development") {
        sanitized.stack = error.stack
    }

    return sanitized
}
