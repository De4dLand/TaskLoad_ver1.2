import api from "../../../../services/api"
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints"

/**
 * Fetch aggregated dashboard data for the current user
 * @returns {Promise<Object>} - Dashboard data including tasks and projects
 */
export const fetchDashboardData = async () => {
  try {
    // Fetch aggregated dashboard data for current user only
    // The userId is handled by the auth token in the API request
    const response = await api.get(API_ENDPOINTS.DASHBOARD.BASE, {
      params: {
        currentUserOnly: true // Explicit parameter to ensure only current user data
      }
    })
    return {
      tasks: response.data.tasks || [],
      projects: response.data.projects || [],
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

/**
 * Fetch task statistics for the current user
 * @returns {Promise<Object>} - Task statistics
 */
export const fetchTaskStats = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.TASKS.STATS)
    return response.data
  } catch (error) {
    console.error("Error fetching task statistics:", error)
    throw error
  }
}

/**
 * Fetch recent activity for the current user
 * @returns {Promise<Array>} - Recent activity items
 */
export const fetchRecentActivity = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.ACTIVITY)
    return response.data
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    throw error
  }
}

// Import project service for project operations
import projectService from './projectService'

// Re-export project service methods
export const { 
  createProject, 
  updateProject, 
  deleteProject, 
  getProjects, 
  getProjectById 
} = projectService

// Import task service for task operations
import { 
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService
} from "../../tasks/services/taskService"

// Re-export task service methods with the same names
export const createTask = createTaskService
export const updateTask = updateTaskService
export const deleteTask = deleteTaskService

/**
 * Fetch user workspace data (tasks created by and assigned to the user)
 * @returns {Promise<Object>} - User workspace data including tasks and projects
 */
export const fetchUserWorkspace = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.BASE)
    return response.data
  } catch (error) {
    console.error("Error fetching user workspace:", error)
    throw error
  }
}

/**
 * Fetch upcoming deadlines
 * @param {number} limit - Number of tasks to fetch
 * @returns {Promise<Array>} - List of upcoming tasks
 */
export const fetchUpcomingDeadlines = async (limit = 5) => {
  try {
    const response = await api.get(API_ENDPOINTS.TASKS.UPCOMING, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error("Error fetching upcoming deadlines:", error)
    throw error
  }
}

/**
 * Fetch recent tasks
 * @param {number} limit - Number of tasks to fetch
 * @returns {Promise<Array>} - List of recent tasks
 */
export const fetchRecentTasks = async (limit = 5) => {
  try {
    const response = await api.get(API_ENDPOINTS.TASKS.RECENT, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error("Error fetching recent tasks:", error)
    throw error
  }
}

/**
 * Fetch workspace data for a specific user
 * @param {string} userId - User ID to fetch workspace for (optional, defaults to current user)
 * @returns {Promise<Object>} - User workspace data
 */
export const fetchUserWorkspaceById = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.getUserDashboard(userId))
    return response.data
  } catch (error) {
    console.error("Error fetching user workspace data:", error)
    throw error
  }
}

/**
 * Add a member to a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to add
 * @param {Object} memberData - Member data (role, position, etc.)
 * @returns {Promise<Object>} - Updated project
 */
export const addProjectMember = async (projectId, userId, memberData = {}) => {
  try {
    // Extract member data or use defaults
    const { role = 'member', position = '', startDate = new Date().toISOString() } = memberData
    
    const response = await api.post(API_ENDPOINTS.PROJECTS.addMember(projectId), { 
      userId, 
      role,
      position,
      startDate
    })
    return response.data
  } catch (error) {
    console.error("Error adding project member:", error)
    throw error
  }
}

/**
 * Search users by username or email
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.search, { params: { query } })
    return response.data
  } catch (error) {
    console.error("Error searching users:", error)
    throw error
  }
}

/**
 * Remove a member from a project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} - Updated project
 */
export const removeMember = async (projectId, userId) => {
  try {
    const response = await api.delete(API_ENDPOINTS.PROJECTS.removeMember(projectId, userId))
    return response.data
  } catch (error) {
    console.error("Error removing project member:", error)
    throw error
  }
}
