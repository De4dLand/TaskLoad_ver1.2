import { format } from "date-fns"
import { logger } from "../utils/logger.js"

export const apiLogger = (req, res, next) => {
  // Get the current timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss")

  // Store the original end method
  const originalEnd = res.end

  // Get the start time
  const start = Date.now()

  // Log the request
  logger.info(`[${timestamp}] ${req.method} ${req.originalUrl} - Request started`)

  // Override the end method to log the response
  res.end = function (chunk, encoding) {
    // Calculate the response time
    const responseTime = Date.now() - start

    // Log the response
    logger.info(`[${timestamp}] ${req.method} ${req.originalUrl} - Response: ${res.statusCode} (${responseTime}ms)`)

    // Call the original end method
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

