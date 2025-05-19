/**
 * Permission utility functions for role-based access control
 */

/**
 * Check if a user has the required role in a project
 * @param {Object} project - The project object
 * @param {String} userId - The user ID to check
 * @param {Array} allowedRoles - Array of roles that have permission
 * @returns {Boolean} - Whether the user has permission
 */
export const hasProjectPermission = (project, userId, allowedRoles) => {
  // Project owner always has all permissions
  if (project.owner.toString() === userId.toString()) return true;
  
  // Find the user in the project members
  const member = project.members.find(m => 
    m.user.toString() === userId.toString() || 
    (m.user._id && m.user._id.toString() === userId.toString())
  );
  
  // Check if user has one of the allowed roles
  return member ? allowedRoles.includes(member.role) : false;
};

/**
 * Check if a user has access to a task
 * @param {Object} task - The task object
 * @param {String} userId - The user ID to check
 * @param {Object} project - The project the task belongs to
 * @returns {Boolean} - Whether the user has access
 */
export const hasTaskAccess = (task, userId, project) => {
  // Task creator and assignee always have access
  if (task.createdBy.toString() === userId.toString()) return true;
  if (task.assignedTo && task.assignedTo.toString() === userId.toString()) return true;
  
  // Check project permissions if project is provided
  if (project) {
    return hasProjectPermission(project, userId, ['owner', 'admin', 'supervisor']);
  }
  
  return false;
};

/**
 * Check if a user can modify a task
 * @param {Object} task - The task object
 * @param {String} userId - The user ID to check
 * @param {Object} project - The project the task belongs to
 * @returns {Boolean} - Whether the user can modify the task
 */
export const canModifyTask = (task, userId, project) => {
  // Task creator and assignee can modify
  if (task.createdBy.toString() === userId.toString()) return true;
  if (task.assignedTo && task.assignedTo.toString() === userId.toString()) return true;
  
  // Project owners, admins and supervisors can modify tasks
  if (project) {
    return hasProjectPermission(project, userId, ['owner', 'admin', 'supervisor']);
  }
  
  return false;
};

/**
 * Check if a user can delete a task
 * @param {Object} task - The task object
 * @param {String} userId - The user ID to check
 * @param {Object} project - The project the task belongs to
 * @returns {Boolean} - Whether the user can delete the task
 */
export const canDeleteTask = (task, userId, project) => {
  // Task creator can delete
  if (task.createdBy.toString() === userId.toString()) return true;
  
  // Project owners and admins can delete tasks
  if (project) {
    return hasProjectPermission(project, userId, ['owner', 'admin']);
  }
  
  return false;
};

/**
 * Get user-specific data based on user ID
 * @param {String} userId - The user ID
 * @param {String} modelName - The model to query (e.g., 'Notification', 'TimeTracking')
 * @param {Object} mongoose - Mongoose instance
 * @returns {Promise<Array>} - Array of documents related to the user
 */
export const getUserData = async (userId, modelName, mongoose) => {
  try {
    const Model = mongoose.model(modelName);
    let query = {};
    
    // Different models may have different user reference field names
    switch(modelName) {
      case 'Notification':
        query = { recipient: userId };
        break;
      case 'TimeTracking':
        query = { user: userId };
        break;
      default:
        query = { user: userId };
    }
    
    return await Model.find(query).sort({ createdAt: -1 });
  } catch (error) {
    console.error(`Error fetching ${modelName} data:`, error);
    return [];
  }
};