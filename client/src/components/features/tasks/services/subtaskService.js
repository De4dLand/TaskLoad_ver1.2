import api from "../../../../services/api"
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints"

/**
 * Create a new subtask
 * @param {Object} subtaskData - Subtask data including task ID, title, description, etc.
 * @returns {Promise<Object>} - Created subtask
 */
export const createSubtask = async (subtaskData) => {
  try {
    const response = await api.post(API_ENDPOINTS.SUBTASKS.BASE, subtaskData)
    return response.data
  } catch (error) {
    console.error('Error creating subtask:', error)
    throw error
  }
}

/**
 * Get all subtasks for a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Array>} - Array of subtasks
 */
export const getSubtasksByTask = async (taskId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBTASKS.getByTask(taskId))
    return response.data
  } catch (error) {
    console.error(`Error fetching subtasks for task ${taskId}:`, error)
    throw error
  }
}

/**
 * Get a subtask by ID
 * @param {string} subtaskId - Subtask ID
 * @returns {Promise<Object>} - Subtask object
 */
export const getSubtaskById = async (subtaskId) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBTASKS.getById(subtaskId))
    return response.data
  } catch (error) {
    console.error(`Error fetching subtask ${subtaskId}:`, error)
    throw error
  }
}

/**
 * Update a subtask
 * @param {string} subtaskId - Subtask ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated subtask
 */
export const updateSubtask = async (subtaskId, updateData) => {
  try {
    const response = await api.put(API_ENDPOINTS.SUBTASKS.getById(subtaskId), updateData)
    return response.data
  } catch (error) {
    console.error(`Error updating subtask ${subtaskId}:`, error)
    throw error
  }
}

/**
 * Delete a subtask
 * @param {string} subtaskId - Subtask ID
 * @returns {Promise<Object>} - Deleted subtask
 */
export const deleteSubtask = async (subtaskId) => {
  try {
    const response = await api.delete(API_ENDPOINTS.SUBTASKS.getById(subtaskId))
    return response.data
  } catch (error) {
    console.error(`Error deleting subtask ${subtaskId}:`, error)
    throw error
  }
}

/**
 * Reorder subtasks for a task
 * @param {string} taskId - Task ID
 * @param {Array<string>} subtaskIds - Array of subtask IDs in the desired order
 * @returns {Promise<Array>} - Reordered subtasks
 */
export const reorderSubtasks = async (taskId, subtaskIds) => {
  try {
    const response = await api.patch(API_ENDPOINTS.SUBTASKS.reorder(taskId), { subtaskIds })
    return response.data
  } catch (error) {
    console.error(`Error reordering subtasks for task ${taskId}:`, error)
    throw error
  }
}