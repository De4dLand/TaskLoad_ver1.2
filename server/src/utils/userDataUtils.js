/**
 * Utility functions for retrieving user-specific data
 */
import mongoose from 'mongoose';

/**
 * Get notifications for a specific user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of notifications
 */
export const getUserNotifications = async (userId) => {
  try {
    // Check if Notification model exists
    if (mongoose.modelNames().includes('Notification')) {
      const Notification = mongoose.model('Notification');
      return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('sender', 'username firstName lastName profileImage')
        .limit(50);
    }
    return [];
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
};

/**
 * Get time tracking entries for a specific user
 * @param {String} userId - The user ID
 * @param {Object} filters - Optional filters like date range, project, etc.
 * @returns {Promise<Array>} - Array of time tracking entries
 */
export const getUserTimeTracking = async (userId, filters = {}) => {
  try {
    // Check if TimeTracking model exists
    if (mongoose.modelNames().includes('TimeTracking')) {
      const TimeTracking = mongoose.model('TimeTracking');
      
      // Build query
      const query = { user: userId };
      
      // Apply filters if provided
      if (filters.startDate) {
        query.startTime = { $gte: new Date(filters.startDate) };
      }
      
      if (filters.endDate) {
        query.endTime = { $lte: new Date(filters.endDate) };
      }
      
      if (filters.project) {
        query.project = filters.project;
      }
      
      if (filters.task) {
        query.task = filters.task;
      }
      
      return await TimeTracking.find(query)
        .sort({ startTime: -1 })
        .populate('task', 'title')
        .populate('project', 'name');
    }
    return [];
  } catch (error) {
    console.error('Error fetching user time tracking:', error);
    return [];
  }
};

/**
 * Get user activity log
 * @param {String} userId - The user ID
 * @param {Number} limit - Maximum number of entries to return
 * @returns {Promise<Array>} - Array of activity log entries
 */
export const getUserActivityLog = async (userId, limit = 20) => {
  try {
    // Check if ActivityLog model exists
    if (mongoose.modelNames().includes('ActivityLog')) {
      const ActivityLog = mongoose.model('ActivityLog');
      return await ActivityLog.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('project', 'name')
        .populate('task', 'title');
    }
    return [];
  } catch (error) {
    console.error('Error fetching user activity log:', error);
    return [];
  }
};

/**
 * Get user's team members
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of team members
 */
export const getUserTeamMembers = async (userId) => {
  try {
    const User = mongoose.model('User');
    const Team = mongoose.model('Team');
    
    // Find teams the user is part of
    const teams = await Team.find({ members: userId });
    const teamIds = teams.map(team => team._id);
    
    // Find all members of those teams
    const teamMembers = await User.find({
      teams: { $in: teamIds },
      _id: { $ne: userId } // Exclude the user themselves
    }).select('username firstName lastName profileImage email role');
    
    return teamMembers;
  } catch (error) {
    console.error('Error fetching user team members:', error);
    return [];
  }
};