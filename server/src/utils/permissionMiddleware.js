/**
 * Permission middleware for role-based access control
 * This file provides middleware functions to check permissions for various features
 */

import { createError } from './error.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import { hasProjectPermission, hasTaskAccess, canModifyTask, canDeleteTask } from './permissions.js';

/**
 * Middleware to check if user has required project permissions
 * @param {Array} allowedRoles - Array of roles that have permission
 * @returns {Function} Express middleware
 */
export const checkProjectPermission = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId || req.body.projectId || req.body.project;
      
      if (!projectId) {
        return next(createError(400, "Project ID is required"));
      }
      
      const project = await Project.findById(projectId);
      
      if (!project) {
        return next(createError(404, "Project not found"));
      }
      
      // Get user ID from request
      const userId = req.user._id.toString();
      
      // Check if user has required permissions
      if (!hasProjectPermission(project, userId, allowedRoles)) {
        return next(createError(403, "You don't have permission to perform this action"));
      }
      
      // Add project to request for later use
      req.project = project;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user has access to a task
 * @returns {Function} Express middleware
 */
export const checkTaskAccess = () => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id || req.params.taskId;
      
      if (!taskId) {
        return next(createError(400, "Task ID is required"));
      }
      
      const task = await Task.findById(taskId);
      
      if (!task) {
        return next(createError(404, "Task not found"));
      }
      
      // Get project for permission checking
      const project = await Project.findById(task.project);
      
      // Get user ID from request
      const userId = req.user._id.toString();
      
      // Check if user has access to this task
      if (!hasTaskAccess(task, userId, project)) {
        return next(createError(403, "You don't have permission to access this task"));
      }
      
      // Add task and project to request for later use
      req.task = task;
      req.project = project;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user can modify a task
 * @returns {Function} Express middleware
 */
export const checkTaskModifyPermission = () => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id || req.params.taskId;
      
      // Check if taskId is provided and is a valid MongoDB ID format
      if (!taskId) {
        return next(createError(400, "Task ID is required"));
      }

      // Check if the ID is a valid MongoDB ID format
      if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
        return next(createError(400, "Invalid Task ID format"));
      }
      
      const task = await Task.findById(taskId);
      
      if (!task) {
        return next(createError(404, "Task not found"));
      }
      
      // Get project for permission checking
      const project = await Project.findById(task.project);
      
      if (!project) {
        return next(createError(404, "Project not found for this task"));
      }
      
      // Get user ID from request
      const userId = req.user?._id?.toString();
      
      if (!userId) {
        return next(createError(401, "Authentication required"));
      }
      
      // Check if user can modify this task
      if (!canModifyTask(task, userId, project)) {
        return next(createError(403, "You don't have permission to modify this task"));
      }
      
      // Add task and project to request for later use
      req.task = task;
      req.project = project;
      next();
    } catch (error) {
      // Handle specific MongoDB cast errors
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return next(createError(400, "Invalid Task ID format"));
      }
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user can delete a task
 * @returns {Function} Express middleware
 */
export const checkTaskDeletePermission = () => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id || req.params.taskId;
      
      if (!taskId) {
        return next(createError(400, "Task ID is required"));
      }
      
      const task = await Task.findById(taskId);
      
      if (!task) {
        return next(createError(404, "Task not found"));
      }
      
      // Get project for permission checking
      const project = await Project.findById(task.project);
      
      // Get user ID from request
      const userId = req.user._id.toString();
      
      // Check if user can delete this task
      if (!canDeleteTask(task, userId, project)) {
        return next(createError(403, "You don't have permission to delete this task"));
      }
      
      // Add task and project to request for later use
      req.task = task;
      req.project = project;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user is a team member or leader
 * @param {Boolean} leaderOnly - If true, only team leader has permission
 * @returns {Function} Express middleware
 */
export const checkTeamPermission = (leaderOnly = false) => {
  return async (req, res, next) => {
    try {
      const teamId = req.params.id || req.params.teamId || req.body.teamId || req.body.team;
      
      if (!teamId) {
        return next(createError(400, "Team ID is required"));
      }
      
      const team = await Team.findById(teamId);
      
      if (!team) {
        return next(createError(404, "Team not found"));
      }
      
      // Get user ID from request
      const userId = req.user._id.toString();
      
      // Check if user is the team leader (if leaderOnly is true)
      if (leaderOnly && team.leader.toString() !== userId) {
        return next(createError(403, "Only team leader can perform this action"));
      }
      
      // Check if user is a team member
      const isMember = team.members.some(member => member.toString() === userId);
      
      if (!isMember && team.leader.toString() !== userId) {
        return next(createError(403, "You are not a member of this team"));
      }
      
      // Add team to request for later use
      req.team = team;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user has access to chat room
 * @returns {Function} Express middleware
 */
export const checkChatAccess = () => {
  return async (req, res, next) => {
    try {
      const roomId = req.params.roomId;
      const userId = req.user._id;
      
      // Find the chat room and verify user is a participant
      const chatRoom = await req.app.locals.mongoose.model('Chat').findOne({
        roomId,
        participants: userId
      });
      
      if (!chatRoom) {
        return next(createError(404, 'Chat room not found or you do not have access'));
      }
      
      // Add chat room to request for later use
      req.chatRoom = chatRoom;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};

/**
 * Middleware to check if user owns a resource
 * @param {String} model - Model name to check ownership
 * @param {String} paramName - Parameter name for resource ID
 * @returns {Function} Express middleware
 */
export const checkResourceOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return next(createError(400, `${model} ID is required`));
      }
      
      const Model = req.app.locals.mongoose.model(model);
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return next(createError(404, `${model} not found`));
      }
      
      // Get user ID from request
      const userId = req.user._id.toString();
      
      // Check if user is the owner
      const ownerId = resource.owner || resource.user || resource.createdBy;
      
      if (!ownerId || ownerId.toString() !== userId) {
        return next(createError(403, `You don't have permission to access this ${model}`));
      }
      
      // Add resource to request for later use
      req[model.toLowerCase()] = resource;
      next();
    } catch (error) {
      next(createError(500, `Permission check error: ${error.message}`));
    }
  };
};