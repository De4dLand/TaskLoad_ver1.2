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
}