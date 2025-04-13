import { validationResult } from "express-validator"
import { createError } from "../utils/error.js"

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // Get all error messages
    const errorMessages = errors.array().map((error) => {
      return `${error.path}: ${error.msg}`
    })

    // Return the first error or all of them
    return next(createError(400, errorMessages.join(", ")))
  }
  next()
}
