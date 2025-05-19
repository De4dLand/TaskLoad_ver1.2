import express from "express"
import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTaskStats,
    getRecentTasks,
    getUpcomingDeadlines,
    getTasksByDateRange,
} from "../controllers/taskController.js"
import auth from "../../../middlewares/auth.js"
import { validateTask, validateTaskUpdate, validateTaskStatus } from "../validator/taskValidator.js"
import { validationResult } from "express-validator"
import { checkTaskAccess, checkTaskModifyPermission, checkTaskDeletePermission } from "../../../utils/permissionMiddleware.js"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(auth)

// GET routes
router.get("/", getTasks)
router.get("/stats", getTaskStats)
router.get("/recent", getRecentTasks)
router.get("/upcoming", getUpcomingDeadlines)
router.get("/date-range", getTasksByDateRange)
router.get("/:id", checkTaskAccess(), getTaskById)

// POST routes
router.post("/", [...validateTask, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await createTask(req, res, next);
}]);

// PUT routes
router.put("/:id", checkTaskModifyPermission(), [...validateTaskUpdate, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await updateTask(req, res, next);
}]);

// PATCH routes
router.patch("/:id/status", checkTaskModifyPermission(), [...validateTaskStatus, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await updateTaskStatus(req, res, next);
}]);

// DELETE routes
router.delete("/:id", checkTaskDeletePermission(), deleteTask);

export default router
