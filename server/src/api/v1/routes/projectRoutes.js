import express from "express"
import auth from "../../../middlewares/auth.js"
import projectController from "../controllers/projectController.js"
import { checkProjectPermission } from "../../../utils/permissionMiddleware.js"

const router = express.Router()

// Apply authentication middleware to all project routes
router.use(auth)

// Get all projects for current user
router.get("/", projectController.getUserProjects)

// Get a specific project - any project member can view
router.get("/:id", checkProjectPermission(['owner', 'admin', 'member', 'supervisor']), projectController.getProjectById)

// Create a new project
router.post("/", projectController.createProject)

// Update a project - only owner and admins can update
router.put("/:id", checkProjectPermission(['owner', 'admin']), projectController.updateProject)

// Delete a project - only owner can delete
router.delete("/:id", checkProjectPermission(['owner']), projectController.deleteProject)

// Get tasks for a project - any project member can view tasks
router.get("/:id/tasks", checkProjectPermission(['owner', 'admin', 'member', 'supervisor']), projectController.getProjectTasks)

// Add a member to a project - only owner and admins can add members
router.post("/:id/members", checkProjectPermission(['owner', 'admin']), projectController.addProjectMember)

// Remove a member from a project - only owner and admins can remove members
router.delete("/:id/members/:userId", checkProjectPermission(['owner', 'admin']), projectController.removeProjectMember)

// Update a member's role in a project - only owner can change roles
router.patch("/:id/members/:userId", checkProjectPermission(['owner']), projectController.updateMemberRole)

export default router
