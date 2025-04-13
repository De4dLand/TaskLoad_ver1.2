import express from "express"
import { authenticate } from "../../../middlewares/auth.js"
import projectController from "../controllers/projectController.js"

const router = express.Router()

// Apply authentication middleware to all project routes
router.use(authenticate)

// Get all projects for current user
router.get("/", projectController.getUserProjects)

// Get a specific project
router.get("/:id", projectController.getProjectById)

// Create a new project
router.post("/", projectController.createProject)

// Update a project
router.put("/:id", projectController.updateProject)

// Delete a project
router.delete("/:id", projectController.deleteProject)

// Get tasks for a project
router.get("/:id/tasks", projectController.getProjectTasks)

// Add a member to a project
router.post("/:id/members", projectController.addProjectMember)

// Remove a member from a project
router.delete("/:id/members/:userId", projectController.removeProjectMember)

// Update a member's role in a project
router.patch("/:id/members/:userId", projectController.updateMemberRole)

export default router
