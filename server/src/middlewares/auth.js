import jwt from 'jsonwebtoken';
import { createError } from '../utils/error.js';
import User from '../models/User.js';
import { findOne } from "../services/teamServices.js";
import Project from '../models/Project.js';

// Create auth object to hold all middleware functions
const auth = {
  // Xác thực JWT token
  verifyToken: async (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError(401, 'No token provided');
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);

      // Kiểm tra user có tồn tại
      const user = await User.findById(userId).select('+isActive');
      if (!user) {
        throw createError(401, 'User not found');
      }

      // Kiểm tra user có active
      if (!user.isActive) {
        throw createError(401, 'User account is deactivated');
      }

      // Thêm user vào request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        next(createError(401, 'Invalid token'));
        return;
      }
      if (error.name === 'TokenExpiredError') {
        next(createError(401, 'Token expired'));
        return;
      }
      next(error);
    }
  },

  // Xác thực refresh token
  verifyRefreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw createError(401, 'No refresh token provided');
      }

      // Verify refresh token
      const { userId } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Kiểm tra user có tồn tại
      const user = await User.findById(userId).select('+isActive');
      if (!user) {
        throw createError(401, 'User not found');
      }

      // Kiểm tra user có active
      if (!user.isActive) {
        throw createError(401, 'User account is deactivated');
      }

      // Thêm user vào request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        next(createError(401, 'Invalid refresh token'));
        return;
      }
      if (error.name === 'TokenExpiredError') {
        next(createError(401, 'Refresh token expired'));
        return;
      }
      next(error);
    }
  },

  // Kiểm tra quyền admin
  isAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return next(createError(403, 'Access denied. Admin only.'));
    }
    next();
  },

  // Kiểm tra quyền team leader
  isTeamLeader: async (req, res, next) => {
    try {
      const teamId = req.params.teamId || req.body.teamId;
      if (!teamId) {
        throw createError(400, 'Team ID is required');
      }

      const team = await findOne(teamId);
      if (!team) {
        throw createError(404, 'Team not found');
      }

      if (team.leader.toString() !== req.user._id.toString()) {
        throw createError(403, 'Access denied. Team leader only.');
      }

      req.team = team;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Kiểm tra quyền team member
  isTeamMember: async (req, res, next) => {
    try {
      const teamId = req.params.teamId || req.body.teamId;
      if (!teamId) {
        throw createError(400, 'Team ID is required');
      }

      const team = await findOne(teamId);
      if (!team) {
        throw createError(404, 'Team not found');
      }

      const isMember = team.members.some(
        member => member.toString() === req.user._id.toString()
      );

      if (!isMember) {
        throw createError(403, 'Access denied. Team member only.');
      }

      req.team = team;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Kiểm tra quyền project leader
  isProjectLeader: async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) {
        throw createError(400, 'Project ID is required');
      }

      const project = await Project.findById(projectId);
      if (!project) {
        throw createError(404, 'Project not found');
      }

      if (project.leader.toString() !== req.user._id.toString()) {
        throw createError(403, 'Access denied. Project leader only.');
      }

      req.project = project;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Kiểm tra quyền project member
  isProjectMember: async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) {
        throw createError(400, 'Project ID is required');
      }

      const project = await Project.findById(projectId);
      if (!project) {
        throw createError(404, 'Project not found');
      }

      const isMember = project.members.some(
        member => member.toString() === req.user._id.toString()
      );

      if (!isMember) {
        throw createError(403, 'Access denied. Project member only.');
      }

      req.project = project;
      next();
    } catch (error) {
      next(error);
    }
  }
};

// Export default middleware
export default auth;
