import { AppError } from "../utils/error.js"
import logger from "../utils/logger.js"

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // Default error
  let error = { ...err }
  error.message = err.message

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `Duplicate field value: ${field}. Please use another value`
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")
    error = new AppError(message, 400)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again."
    error = new AppError(message, 401)
  }

  if (err.name === "TokenExpiredError") {
    const message = "Your token has expired. Please log in again."
    error = new AppError(message, 401)
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

