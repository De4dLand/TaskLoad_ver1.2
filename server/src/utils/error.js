// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Create error with message and status code
export const createError = (statusCode, message) => {
  return new AppError(message, statusCode)
}

// Async error handler wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

// Global error handler
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    })
  } else {
    // Production mode
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      })
    } else {
      // Programming or unknown errors
      console.error("ERROR 💥", err)
      res.status(500).json({
        status: "error",
        message: "Something went wrong!"
      })
    }
  }
}

// Handle JWT errors
export const handleJWTError = (err) => {
  return new AppError("Invalid token. Please log in again!", 401)
}

// Handle JWT expired errors
export const handleJWTExpiredError = (err) => {
  return new AppError("Your token has expired! Please log in again.", 401)
}

// Handle validation errors
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join(". ")}`
  return new AppError(message, 400)
}

// Handle duplicate key errors
export const handleDuplicateKeyError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

// Handle cast errors
export const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}