import express from "express"
import taskController from "../controllers/taskController.js"
import taskChatController from "../controllers/taskChatController.js"
import auth from "../../../middlewares/auth.js"
import { validateTask, validateTaskUpdate, validateTaskStatus } from "../validator/taskValidator.js"
import { validationResult } from "express-validator"
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
router.patch("/:id", checkTaskModifyPermission(), [...validateTaskUpdate, async (req, res) => {
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

export default router
