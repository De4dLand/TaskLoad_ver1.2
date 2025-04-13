import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import User from "../models/User.js"
import { createError } from "../utils/error.js"

export const AuthService = {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email: userData.email }, { username: userData.username }] })
      if (existingUser) {
        throw createError(
          400,
          existingUser.email === userData.email ? "Email already in use" : "Username already taken",
        )
      }

      // Create and save new user
      const user = new User(userData)
      await user.save()

      // Generate JWT token
      const token = this.generateAccessToken(user)

      // Return user data (excluding password) and token
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      }
    } catch (error) {
      throw error
    }
  },

  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        throw createError(401, "Invalid credentials")
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        throw createError(401, "Invalid credentials")
      }

      // Generate JWT token
      const token = this.generateAccessToken(user)

      // Return user data and token
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      }
    } catch (error) {
      throw error
    }
  },

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

      // Find user
      const user = await User.findById(decoded.id)
      if (!user) {
        throw createError(401, "Invalid refresh token")
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user)

      return accessToken
    } catch (error) {
      throw createError(401, "Invalid refresh token")
    }
  },

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find user
      const user = await User.findById(userId)
      if (!user) {
        throw createError(404, "User not found")
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) {
        throw createError(401, "Current password is incorrect")
      }

      // Update password
      user.password = newPassword
      await user.save()

      return true
    } catch (error) {
      throw error
    }
  },

  generateAccessToken(user) {
    return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
  },

  generateRefreshToken(user) {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })
  },
}

