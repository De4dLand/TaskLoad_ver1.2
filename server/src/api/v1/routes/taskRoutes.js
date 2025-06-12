import express from "express"
import taskController from "../controllers/taskController.js"
import taskChatController from "../controllers/taskChatController.js"
import auth from "../../../middlewares/auth.js"
import { validateTask, validateTaskUpdate, validateTaskStatus } from "../validator/taskValidator.js"
import { validationResult, body } from "express-validator"
import { checkTaskAccess, checkTaskModifyPermission, checkTaskDeletePermission } from "../../../utils/permissionMiddleware.js"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(auth.verifyToken)

// GET routes
router.get("/", taskController.getTasks)
router.get("/stats", taskController.getTaskStats)
router.get("/recent", taskController.getRecentTasks)
router.get("/upcoming", taskController.getUpcomingDeadlines)
router.get("/date-range", taskController.getTasksByDateRange)
router.get("/:id", checkTaskAccess(), taskController.getTaskById)

// POST routes
router.post("/", [...validateTask, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await taskController.createTask(req, res);
}]);

// PUT routes
router.put("/:id", checkTaskModifyPermission(), [...validateTaskUpdate, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await taskController.updateTask(req, res);
}]);

// PATCH routes
router.patch("/:id/status", checkTaskModifyPermission(), [...validateTaskStatus, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await taskController.updateTaskStatus(req, res);
}]);

// DELETE routes
router.delete("/:id", checkTaskDeletePermission(), taskController.deleteTask);

// Task Chat routes
router.get("/:taskId/chat", checkTaskAccess(), taskChatController.getTaskChatHistory);
router.post("/:taskId/chat", checkTaskAccess(), taskChatController.sendTaskChatMessage);
router.patch("/:taskId/chat/read", checkTaskAccess(), taskChatController.markMessagesAsRead);

// Subtask routes

router.get("/:taskId/subtasks", checkTaskAccess(), taskController.getSubtasks);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks:
 *   post:
 *     summary: Add a new subtask to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Subtask created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtask'
 */
router.post(
  "/:taskId/subtasks",
  checkTaskModifyPermission(),
  [
    body('title').trim().notEmpty().withMessage('Title is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await taskController.addSubtask(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{subtaskId}:
 *   patch:
 *     summary: Update a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subtask
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtask'
 */
router.patch(
  "/:taskId/subtasks/:subtaskId",
  checkTaskModifyPermission(),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await taskController.updateSubtask(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{subtaskId}:
 *   delete:
 *     summary: Delete a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subtask to delete
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Subtask deleted successfully'
 */
router.delete(
  "/:taskId/subtasks/:subtaskId",
  checkTaskModifyPermission(),
  taskController.deleteSubtask
);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{subtaskId}/toggle:
 *   patch:
 *     summary: Toggle subtask completion status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subtask to toggle
 *     responses:
 *       200:
 *         description: Subtask toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtask'
 */
router.patch(
  "/:taskId/subtasks/:subtaskId/toggle",
  checkTaskModifyPermission(),
  taskController.toggleSubtask
);

export default router
