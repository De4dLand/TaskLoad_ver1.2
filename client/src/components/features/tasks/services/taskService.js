import api from "../../../../services/api"
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints"

/**
 * Fetch tasks with optional filtering, sorting, and pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<{tasks: Array, pagination: Object}>}
 */
export const getTasks = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.TASKS.BASE, { params })
    return response.data
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
}

/**
 * Get a task by its ID
 * @param {string} id - Task ID
 * @returns {Promise<Object>} - Task object
 */
export const getTaskById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.TASKS.getById(id))
    return response.data
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error)
    throw error
  }
}

/**
 * Create a new task
 * @param {Object} taskData - Task data matching the Task model schema
 * @returns {Promise<Object>} - Created task
 */
export const createTask = async (taskData) => {
  try {
    // Ensure data matches the backend model requirements
    const formattedData = formatTaskData(taskData)
    
    const response = await api.post(API_ENDPOINTS.TASKS.BASE, formattedData)
    return response.data
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

/**
 * Update an existing task
 * @param {string} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>} - Updated task
 */
export const updateTask = async (id, taskData) => {
  try {
    // Ensure data matches the backend model requirements
    const formattedData = formatTaskData(taskData)
    
    const response = await api.put(API_ENDPOINTS.TASKS.getById(id), formattedData)
    return response.data
  } catch (error) {
    console.error(`Error updating task ${id}:`, error)
    throw error
  }
}

/**
 * Delete a task
 * @param {string} id - Task ID
 * @returns {Promise<Object>} - Response message
 */
export const deleteTask = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.TASKS.getById(id))
    return response.data
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error)
    throw error
  }
}

/**
 * Update a task's status
 * @param {string} id - Task ID
 * @param {string} status - New status (must match enum in Task model)
 * @returns {Promise<Object>} - Updated task
 */
export const updateTaskStatus = async (id, status) => {
  try {
    // Validate status against the backend enum
    const validStatuses = ['new', 'assigned', 'todo', 'in_progress', 'reviewing', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
    }
    
    const response = await api.patch(API_ENDPOINTS.TASKS.updateStatus(id), { status })
    return response.data
  } catch (error) {
    console.error(`Error updating task status ${id}:`, error)
    throw error
  }
}

/**
 * Helper function to format task data to match backend model requirements
 * @param {Object} taskData - Raw task data from form
 * @returns {Object} - Formatted task data
 */


export const formatTaskData = (taskData) => {
  const formatttedData = {
    title: taskData.title,
    description: taskData.description || "",
    status: taskData.status || "todo",
    priority: taskData.priority || "medium",
    tags: Array.isArray(taskData.tags) ? taskData.tags : [],
    actualHours: taskData.actualHours ? Number(taskData.actualHours) : null,
    subtasks: Array.isArray(taskData.subtasks) 
      ? taskData.subtasks.map(st => ({
          title: st.title,
          completed: Boolean(st.completed)
        })) 
      : []
  };
  if (taskData.project) {
    formatttedData.project = taskData.project._id || taskData.project;
  } 
  if (taskData.dueDate) {
    formatttedData.dueDate = taskData.dueDate;
  }
  if (taskData.startDate) {
    formatttedData.startDate = taskData.startDate;
  } 
  if (taskData.estimatedHours) {
    formatttedData.estimatedHours = Number(taskData.estimatedHours);
  } 
  if (taskData.assignedTo) {
    formatttedData.assignedTo = taskData.assignedTo
  }
  if (taskData.assignedTo?.username ) {
    formatttedData.assignedTo = taskData.assignedTo._id
  }

  // Log the formatted data for debugging
  console.log('Formatted task data:', formatttedData);
  
  return formatttedData;
}