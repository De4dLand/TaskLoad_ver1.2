import { UserService } from '../../../services/userService.js';
import { catchAsync, createError } from '../../../utils/error.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  // Đăng ký
  register = catchAsync(async (req, res) => {
    const user = await this.userService.register(req.body);

    res.status(201).json({
      status: 'success',
      data: { user }
    });
  });

  // Đăng nhập
  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await this.userService.login(email, password);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  // Lấy thông tin user
  getMe = catchAsync(async (req, res) => {
    const user = await this.userService.getUserById(req.user._id);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  });

  // Cập nhật thông tin user
  updateMe = catchAsync(async (req, res) => {
    const user = await this.userService.updateUser(req.user._id, req.body);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  });

  // Xóa user
  deleteMe = catchAsync(async (req, res) => {
    await this.userService.deleteUser(req.user._id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  // Quên mật khẩu
  forgotPassword = catchAsync(async (req, res) => {
    const result = await this.userService.forgotPassword(req.body.email);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  // Reset mật khẩu
  resetPassword = catchAsync(async (req, res) => {
    const { token, password } = req.body;
    const result = await this.userService.resetPassword(token, password);

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  // Cập nhật avatar
  updateAvatar = catchAsync(async (req, res) => {
    const user = await this.userService.updateAvatar(
      req.user._id,
      req.body.avatarUrl
    );

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  });

  // Search users by username or email
  searchUsers = catchAsync(async (req, res) => {
    const { query } = req.query;
    const users = await this.userService.searchUsers(query || '');
    res.status(200).json(users);
  });

  // Get user preferences
  getUserPreferences = catchAsync(async (req, res) => {
    const user = await this.userService.getUserById(req.user._id);
    
    res.status(200).json({
      status: 'success',
      data: { preferences: user.preferences || {} }
    });
  });

  // Update user preferences
  updateUserPreferences = catchAsync(async (req, res) => {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      throw createError(400, 'Preferences must be a valid object');
    }
    
    const user = await this.userService.updateUserPreferences(req.user._id, preferences);
    
    res.status(200).json({
      status: 'success',
      data: { preferences: user.preferences }
    });
  });

  // Get user statistics
  getUserStats = catchAsync(async (req, res) => {
    const stats = await this.userService.getUserStats(req.user._id);
    
    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  });

  // Get user custom fields
  getCustomFields = catchAsync(async (req, res) => {
    const user = await this.userService.getUserById(req.user._id);
    
    res.status(200).json({
      status: 'success',
      data: { customFields: user.customFields || [] }
    });
  });

  // Add custom field
  addCustomField = catchAsync(async (req, res) => {
    const { name, value } = req.body;
    
    if (!name) {
      throw createError(400, 'Field name is required');
    }
    
    const user = await this.userService.addCustomField(req.user._id, name, value);
    
    res.status(200).json({
      status: 'success',
      data: { customFields: user.customFields }
    });
  });

  // Update custom field
  updateCustomField = catchAsync(async (req, res) => {
    const { name, value } = req.body;
    
    if (!name) {
      throw createError(400, 'Field name is required');
    }
    
    const user = await this.userService.updateCustomField(req.user._id, name, value);
    
    res.status(200).json({
      status: 'success',
      data: { customFields: user.customFields }
    });
  });
}
