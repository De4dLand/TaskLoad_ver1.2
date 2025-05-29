import express from 'express'
import { protect } from '../../middlewares/authMiddleware.js'
import {
  createSubtask,
  getSubtasksByTask,
  getSubtaskById,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks
} from '../controllers/subtaskController.js'

const router = express.Router()

// Protect all routes
router.use(protect)

// Routes for /api/subtasks
router.route('/')
  .post(createSubtask)

router.route('/:id')
  .get(getSubtaskById)
  .put(updateSubtask)
  .delete(deleteSubtask)

// Routes for /api/tasks/:taskId/subtasks
const taskSubtaskRouter = express.Router({ mergeParams: true })
taskSubtaskRouter.route('/')
  .get(getSubtasksByTask)

taskSubtaskRouter.route('/reorder')
  .put(reorderSubtasks)

export { router as subtaskRoutes, taskSubtaskRouter }