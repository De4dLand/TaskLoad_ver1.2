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
import { validate } from "../middlewares/validationMiddleware.js"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(auth)

// GET routes
router.get("/", getTasks)
router.get("/stats", getTaskStats)
router.get("/recent", getRecentTasks)
router.get("/upcoming", getUpcomingDeadlines)
router.get("/date-range", getTasksByDateRange)
router.get("/:id", getTaskById)

// POST routes
router.post("/", validate(validateTask), createTask)

// PUT routes
router.put("/:id", validate(validateTaskUpdate), updateTask)

// PATCH routes
router.patch("/:id/status", validate(validateTaskStatus), updateTaskStatus)

// DELETE routes
router.delete("/:id", deleteTask)

export default router
