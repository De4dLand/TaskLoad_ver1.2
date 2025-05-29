import subtaskService from '../../services/subtaskService.js'
import { asyncHandler } from '../../middlewares/asyncHandler.js'

/**
 * Create a new subtask
 * @route POST /api/subtasks
 * @access Private
 */
const createSubtask = asyncHandler(async (req, res) => {
  const subtask = await subtaskService.createSubtask(req.body, req.user._id)
  res.status(201).json(subtask)
})

/**
 * Get all subtasks for a task
 * @route GET /api/tasks/:taskId/subtasks
 * @access Private
 */
const getSubtasksByTask = asyncHandler(async (req, res) => {
  const subtasks = await subtaskService.getSubtasksByTask(req.params.taskId)
  res.json(subtasks)
})

/**
 * Get a subtask by ID
 * @route GET /api/subtasks/:id
 * @access Private
 */
const getSubtaskById = asyncHandler(async (req, res) => {
  const subtask = await subtaskService.getSubtaskById(req.params.id)
  
  if (!subtask) {
    res.status(404)
    throw new Error('Subtask not found')
  }
  
  res.json(subtask)
})

/**
 * Update a subtask
 * @route PUT /api/subtasks/:id
 * @access Private
 */
const updateSubtask = asyncHandler(async (req, res) => {
  const subtask = await subtaskService.updateSubtask(req.params.id, req.body)
  res.json(subtask)
})

/**
 * Delete a subtask
 * @route DELETE /api/subtasks/:id
 * @access Private
 */
const deleteSubtask = asyncHandler(async (req, res) => {
  await subtaskService.deleteSubtask(req.params.id)
  res.json({ message: 'Subtask removed' })
})

/**
 * Reorder subtasks
 * @route PUT /api/tasks/:taskId/subtasks/reorder
 * @access Private
 */
const reorderSubtasks = asyncHandler(async (req, res) => {
  const { subtaskIds } = req.body
  
  if (!Array.isArray(subtaskIds)) {
    res.status(400)
    throw new Error('subtaskIds must be an array')
  }
  
  const subtasks = await subtaskService.reorderSubtasks(req.params.taskId, subtaskIds)
  res.json(subtasks)
})

export {
  createSubtask,
  getSubtasksByTask,
  getSubtaskById,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks
}