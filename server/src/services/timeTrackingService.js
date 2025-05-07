import TimeTracking from '../models/TimeTracking.js';

/**
 * Service for handling time tracking operations
 */
class TimeTrackingService {
  /**
   * Start a new time tracking session
   * @param {Object} sessionData - Time tracking session data
   * @returns {Promise<Object>} - Created time tracking session
   */
  static async startSession(sessionData) {
    try {
      // Check if there's already an active session for this user and task/project
      const existingSession = await TimeTracking.findOne({
        userId: sessionData.userId,
        isActive: true,
        $or: [
          { taskId: sessionData.taskId },
          { projectId: sessionData.projectId }
        ].filter(Boolean) // Filter out undefined conditions
      });

      if (existingSession) {
        // Automatically end the existing session
        existingSession.endTime = new Date();
        existingSession.duration = Math.floor((existingSession.endTime - existingSession.startTime) / 1000);
        existingSession.isActive = false;
        await existingSession.save();
      }

      // Create new session
      const session = new TimeTracking(sessionData);
      return await session.save();
    } catch (error) {
      console.error('Error starting time tracking session:', error);
      throw error;
    }
  }

  /**
   * Stop a time tracking session
   * @param {string} sessionId - Session ID
   * @param {Date} endTime - End time
   * @returns {Promise<Object>} - Updated time tracking session
   */
  static async stopSession(sessionId, endTime = new Date()) {
    try {
      const session = await TimeTracking.findById(sessionId);
      if (!session) {
        throw new Error(`Time tracking session not found: ${sessionId}`);
      }

      if (!session.isActive) {
        throw new Error(`Session is already stopped: ${sessionId}`);
      }

      session.endTime = endTime;
      session.duration = Math.floor((endTime - session.startTime) / 1000);
      session.isActive = false;
      return await session.save();
    } catch (error) {
      console.error('Error stopping time tracking session:', error);
      throw error;
    }
  }

  /**
   * Update heartbeat for an active session
   * @param {string} sessionId - Session ID
   * @param {Date} currentTime - Current time
   * @returns {Promise<Object>} - Updated time tracking session
   */
  static async updateHeartbeat(sessionId, currentTime = new Date()) {
    try {
      // This is a lightweight update to indicate the session is still active
      return await TimeTracking.findByIdAndUpdate(
        sessionId,
        { $set: { updatedAt: currentTime } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating time tracking heartbeat:', error);
      throw error;
    }
  }

  /**
   * Get active time tracking sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of active sessions
   */
  static async getActiveSessions(userId) {
    try {
      return await TimeTracking.find({ userId, isActive: true })
        .populate('taskId', 'title description')
        .populate('projectId', 'name description')
        .exec();
    } catch (error) {
      console.error('Error getting active time tracking sessions:', error);
      throw error;
    }
  }

  /**
   * Get time tracking history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, skip, startDate, endDate, etc.)
   * @returns {Promise<Array>} - Array of time tracking sessions
   */
  static async getUserTimeHistory(userId, options = {}) {
    try {
      const { limit = 50, skip = 0, startDate, endDate, taskId, projectId } = options;
      
      const query = { userId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      
      // Add task or project filter if provided
      if (taskId) query.taskId = taskId;
      if (projectId) query.projectId = projectId;
      
      return await TimeTracking.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('taskId', 'title description')
        .populate('projectId', 'name description')
        .exec();
    } catch (error) {
      console.error('Error getting user time history:', error);
      throw error;
    }
  }

  /**
   * Get time tracking summary for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (startDate, endDate, groupBy, etc.)
   * @returns {Promise<Object>} - Time tracking summary
   */
  static async getUserTimeSummary(userId, options = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = options;
      
      const query = { userId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      
      // Group by day, week, month, project, or task
      const groupByField = {};
      if (groupBy === 'project') {
        groupByField._id = '$projectId';
      } else if (groupBy === 'task') {
        groupByField._id = '$taskId';
      } else {
        // Group by date (day, week, month)
        const dateFormat = {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          week: { $week: '$startTime' },
          month: { $dateToString: { format: '%Y-%m', date: '$startTime' } }
        };
        groupByField._id = dateFormat[groupBy] || dateFormat.day;
      }
      
      const result = await TimeTracking.aggregate([
        { $match: query },
        { $group: {
          ...groupByField,
          totalDuration: { $sum: '$duration' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
      
      // If grouped by project or task, populate the references
      if (groupBy === 'project' || groupBy === 'task') {
        const populateModel = groupBy === 'project' ? 'Project' : 'Task';
        const populateField = groupBy === 'project' ? 'name' : 'title';
        
        for (const item of result) {
          if (item._id) {
            const model = await mongoose.model(populateModel).findById(item._id).select(populateField);
            if (model) {
              item.name = model[populateField];
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting user time summary:', error);
      throw error;
    }
  }

  /**
   * Get project time tracking summary
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Project time tracking summary
   */
  static async getProjectTimeSummary(projectId, options = {}) {
    try {
      const { groupBy = 'user' } = options;
      
      const groupByField = {};
      if (groupBy === 'user') {
        groupByField._id = '$userId';
      } else if (groupBy === 'task') {
        groupByField._id = '$taskId';
      } else {
        // Group by date (day, week, month)
        const dateFormat = {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          week: { $week: '$startTime' },
          month: { $dateToString: { format: '%Y-%m', date: '$startTime' } }
        };
        groupByField._id = dateFormat[groupBy] || dateFormat.day;
      }
      
      const result = await TimeTracking.aggregate([
        { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
        { $group: {
          ...groupByField,
          totalDuration: { $sum: '$duration' },
          count: { $sum: 1 }
        }},
        { $sort: { totalDuration: -1 } }
      ]);
      
      // Populate user or task information if grouped by those
      if (groupBy === 'user' || groupBy === 'task') {
        const populateModel = groupBy === 'user' ? 'User' : 'Task';
        const populateField = groupBy === 'user' ? 'username' : 'title';
        
        for (const item of result) {
          if (item._id) {
            const model = await mongoose.model(populateModel).findById(item._id).select(populateField);
            if (model) {
              item.name = model[populateField];
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting project time summary:', error);
      throw error;
    }
  }
}

export default TimeTrackingService;