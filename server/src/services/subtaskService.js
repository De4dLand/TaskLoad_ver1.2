import Subtask from '../models/Subtask.js'
import Task from '../models/Task.js'
import mongoose from 'mongoose'
import { createCache, getCache, deleteCache } from '../utils/cache.js'

/**
 * Create a new subtask
 * @param {Object} subtaskData - Subtask data
 * @param {string} userId - User ID of the creator
 * @returns {Promise<Object>} - Created subtask
 */
async function createSubtask(subtaskData, userId) {
  // Ensure the task exists
  const task = await Task.findById(subtaskData.task)
  if (!task) {
    throw new Error('Task not found')
  }
  
  // Get the highest order value for existing subtasks
  const highestOrderSubtask = await Subtask.findOne({ task: subtaskData.task })
    .sort({ order: -1 })
    .limit(1)
  
  const order = highestOrderSubtask ? highestOrderSubtask.order + 1 : 0
  
  // Create the subtask with the next order value
  const subtask = await Subtask.create({
    ...subtaskData,
    createdBy: userId,
    order
  })
  
  // Invalidate cache
  await deleteCache(`task:${subtaskData.task}:subtasks`)
  
  return subtask
}

/**
 * Get all subtasks for a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Array>} - List of subtasks
 */
async function getSubtasksByTask(taskId) {
  // Try to get from cache first
  const cachedSubtasks = await getCache(`task:${taskId}:subtasks`)
  if (cachedSubtasks) {
    return cachedSubtasks
  }
  
  // If not in cache, fetch from database
  const subtasks = await Subtask.find({ task: taskId })
    .sort({ order: 1 })
    .populate('assignedTo', 'username firstName lastName profileImage')
  
  // Store in cache for 5 minutes
  await createCache(`task:${taskId}:subtasks`, subtasks, 300)
  
  return subtasks
}

/**
 * Get a subtask by ID
 * @param {string} subtaskId - Subtask ID
 * @returns {Promise<Object>} - Subtask
 */
async function getSubtaskById(subtaskId) {
  return Subtask.findById(subtaskId)
    .populate('assignedTo', 'username firstName lastName profileImage')
    .populate('createdBy', 'username firstName lastName profileImage')
}

/**
 * Update a subtask
 * @param {string} subtaskId - Subtask ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated subtask
 */
async function updateSubtask(subtaskId, updateData) {
  const subtask = await Subtask.findByIdAndUpdate(
    subtaskId,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!subtask) {
    throw new Error('Subtask not found')
  }
  
  // Invalidate cache
  await deleteCache(`task:${subtask.task}:subtasks`)
  
  return subtask
}

/**
 * Delete a subtask
 * @param {string} subtaskId - Subtask ID
 * @returns {Promise<Object>} - Deleted subtask
 */
async function deleteSubtask(subtaskId) {
  const subtask = await Subtask.findById(subtaskId)
  
  if (!subtask) {
    throw new Error('Subtask not found')
  }
  
  const taskId = subtask.task
  
  await Subtask.findByIdAndDelete(subtaskId)
  
  // Invalidate cache
  await deleteCache(`task:${taskId}:subtasks`)
  
  return subtask
}

/**
 * Reorder subtasks
 * @param {string} taskId - Task ID
 * @param {Array} subtaskIds - Array of subtask IDs in the new order
 * @returns {Promise<Array>} - Updated subtasks
 */
async function reorderSubtasks(taskId, subtaskIds) {
  // Validate that all subtasks belong to the task
  const subtasks = await Subtask.find({ task: taskId })
  const subtaskMap = new Map(subtasks.map(s => [s._id.toString(), s]))
  
  // Check if all provided IDs belong to this task
  for (const id of subtaskIds) {
    if (!subtaskMap.has(id)) {
      throw new Error(`Subtask ${id} does not belong to task ${taskId}`)
    }
  }
  
  // Update order for each subtask
  const updateOperations = subtaskIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { order: index }
    }
  }))
  
  await Subtask.bulkWrite(updateOperations)
  
  // Invalidate cache
  await deleteCache(`task:${taskId}:subtasks`)
  
  // Return updated subtasks
  return getSubtasksByTask(taskId)
}

export default {
  createSubtask,
  getSubtasksByTask,
  getSubtaskById,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks
}