import User from '../models/User.js';
import { createError } from '../utils/error.js';
import pkg from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js';
const { genSalt, hash, compare } = pkg;
export class UserService {
    // Đăng ký người dùng mới
    async register(userData) {
        const { email, password } = userData;

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw createError(400, 'Email already exists');
        }

        // Tạo user mới
        const user = await User.create({
            email,
            password,
        });

        // Gửi email xác nhận
        await sendEmail({
            to: email,
            subject: 'Welcome to TaskLoad',
            text: `Hello ${firstName || username}, welcome to TaskLoad!`
        });

        return user;
    }

    // Đăng nhập
    async login(email, password) {
        // Tìm user theo email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw createError(401, 'Invalid credentials');
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw createError(401, 'Invalid credentials');
        }

        // Cập nhật lastLogin
        user.lastLogin = Date.now();
        await user.save();

        // Tạo JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return {
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage
            },
            token,
            refreshToken
        };
    }

    // Lấy thông tin user
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw createError(404, 'User not found');
        }
        return user;
    }

    // Cập nhật thông tin user
    async updateUser(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) {
            throw createError(404, 'User not found');
        }

        // Nếu cập nhật mật khẩu
        if (updateData.password) {
            const salt = await genSalt(10);
            updateData.password = await hash(updateData.password, salt);
        }

        Object.assign(user, updateData);
        await user.save();

        return user;
    }

    // Xóa user
    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw createError(404, 'User not found');
        }
        return user;
    }

    // Quên mật khẩu
    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) {
            throw createError(404, 'User not found');
        }

        // Tạo reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Lưu reset token vào user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // Gửi email reset password
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendEmail({
            to: email,
            subject: 'Password Reset Request',
            text: `Click the following link to reset your password: ${resetUrl}`
        });

        return { message: 'Password reset email sent' };
    }

    // Reset mật khẩu
    async resetPassword(token, newPassword) {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw createError(400, 'Invalid or expired reset token');
        }

        // Mã hóa mật khẩu mới
        const salt = await genSalt(10);
        user.password = await hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return { message: 'Password reset successful' };
    }

    // Cập nhật avatar
    async updateAvatar(userId, avatarUrl) {
        const user = await User.findById(userId);
        if (!user) {
            throw createError(404, 'User not found');
        }

        user.profileImage = avatarUrl;
        await user.save();

        return user;
    }

    /**
     * Search users by username, email, first name, or last name
     * Supports partial matches anywhere in the field
     * @param {string} query - Search query (can be partial)
     * @returns {Promise<Array>} - Array of matching users
     */
    async searchUsers(query) {
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return [];
      }

      // Escape special regex characters and create a case-insensitive regex
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      
      try {
        const users = await User.find({
          $or: [
            { username: { $regex: regex } },
            { email: { $regex: regex } },
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
            // Search by full name (first + last)
            { 
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$firstName", " ", "$lastName"] },
                  regex: escapedQuery,
                  options: 'i'
                }
              }
            }
          ]
        })
        .select('username email firstName lastName _id')
        .limit(50); // Limit results to prevent performance issues

        return users;
      } catch (error) {
        console.error('Error in searchUsers:', error);
        throw error;
      }
    }

    // Update user preferences
    async updateUserPreferences(userId, preferences) {
      const user = await User.findById(userId);
      if (!user) {
        throw createError(404, 'User not found');
      }

      // Initialize preferences if it doesn't exist
      if (!user.preferences) {
        user.preferences = new Map();
      }

      // Update preferences
      Object.entries(preferences).forEach(([key, value]) => {
        user.preferences.set(key, value);
      });

      await user.save();
      return user;
    }

    // Get user statistics
    async getUserStats(userId) {
      const user = await User.findById(userId)
        .populate('teamCount')
        .populate('projectCount')
        .populate('taskCount')
        .populate('createdTaskCount')
        .populate({
          path: 'tasksByStatus',
          select: 'status'
        });

      if (!user) {
        throw createError(404, 'User not found');
      }

      // Calculate task status distribution
      const taskStatusDistribution = {};
      if (user.tasksByStatus && user.tasksByStatus.length > 0) {
        user.tasksByStatus.forEach(task => {
          if (!taskStatusDistribution[task.status]) {
            taskStatusDistribution[task.status] = 0;
          }
          taskStatusDistribution[task.status]++;
        });
      }

      return {
        teams: user.teamCount || 0,
        projects: user.projectCount || 0,
        assignedTasks: user.taskCount || 0,
        createdTasks: user.createdTaskCount || 0,
        taskStatusDistribution,
        lastLogin: user.lastLogin
      };
    }

    // Add custom field
    async addCustomField(userId, name, value) {
      const user = await User.findById(userId);
      if (!user) {
        throw createError(404, 'User not found');
      }

      // Initialize customFields if it doesn't exist
      if (!user.customFields) {
        user.customFields = [];
      }

      // Check if field already exists
      const existingFieldIndex = user.customFields.findIndex(field => field.name === name);
      if (existingFieldIndex !== -1) {
        throw createError(400, `Field '${name}' already exists. Use update method instead.`);
      }

      // Add new field
      user.customFields.push({
        name,
        value,
        createdAt: new Date()
      });

      await user.save();
      return user;
    }

    // Update custom field
    async updateCustomField(userId, name, value) {
      const user = await User.findById(userId);
      if (!user) {
        throw createError(404, 'User not found');
      }

      // Check if customFields exists
      if (!user.customFields || !Array.isArray(user.customFields)) {
        user.customFields = [];
        throw createError(404, `Field '${name}' not found`);
      }

      // Find field
      const fieldIndex = user.customFields.findIndex(field => field.name === name);
      if (fieldIndex === -1) {
        throw createError(404, `Field '${name}' not found`);
      }

      // Update field
      user.customFields[fieldIndex].value = value;
      user.customFields[fieldIndex].updatedAt = new Date();

      await user.save();
      return user;
    }
}