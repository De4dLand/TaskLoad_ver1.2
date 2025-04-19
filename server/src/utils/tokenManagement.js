import jwt from "jsonwebtoken"
import redisClient from "../loaders/redis.js"
import logger from "../utils/logger.js"

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
export const generateTokens = (user) => {
    const token = jwt.sign(
        {
            userId: user._id,
            username: user.username,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
    )

    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    })

    return { token, refreshToken }
}

/**
 * Clear authentication tokens from cookies
 * @param {Response} res - Express response object
 */
export const clearTokens = (res) => {
    res.cookie("accessToken", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    })

    res.cookie("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth/refresh-token",
    })
}

/**
 * Store refresh token in Redis
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @param {number} ttl - Time-to-live in seconds (default: 7 days)
 * @returns {Promise<boolean>} Success status
 */
export const storeRefreshToken = async (userId, token, ttl = 604800) => {
    try {
        if (!redisClient.isReady) {
            logger.warn("Redis not available for storing refresh token")
            return false
        }

        await redisClient.set(`refresh_token:${userId}`, token, { EX: ttl })
        return true
    } catch (error) {
        logger.error("Failed to store refresh token", { error: error.message })
        return false
    }
}

/**
 * Invalidate refresh token in Redis
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const invalidateRefreshToken = async (userId) => {
    try {
        if (!redisClient.isReady) {
            logger.warn("Redis not available for invalidating refresh token")
            return false
        }

        await redisClient.del(`refresh_token:${userId}`)
        return true
    } catch (error) {
        logger.error("Failed to invalidate refresh token", { error: error.message })
        return false
    }
}

/**
 * Verify token and extract user ID
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @returns {string|null} User ID if valid, null otherwise
 */
export const verifyTokenGetUserId = (token, secret) => {
    try {
        const decoded = jwt.verify(token, secret)
        return decoded.userId || null
    } catch (error) {
        logger.debug("Token verification failed", { error: error.message })
        return null
    }
}
