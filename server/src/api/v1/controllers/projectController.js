import Project from "../../../models/Project.js"
import Task from "../../../models/Task.js"
import { createError } from "../../../utils/error.js"

const projectController = {
    // Get all projects for current user
    async getUserProjects(req, res, next) {
        try {
            const projects = await Project.find({
                $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
            }).sort({ updatedAt: -1 })

            res.json(projects)
        } catch (error) {
            next(createError(500, "Error fetching projects"))
        }
    },

    // Get a specific project
    async getProjectById(req, res, next) {
        try {
            const project = await Project.findById(req.params.id)
                .populate("owner", "username email")
                .populate("members.user", "username email")

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user has access to this project
            if (!project.hasAccess(req.user._id)) {
                return next(createError(403, "You don't have access to this project"))
            }

            res.json(project)
        } catch (error) {
            next(createError(500, "Error fetching project"))
        }
    },

    // Create a new project
    async createProject(req, res, next) {
        try {
            const { name, description, color } = req.body

            const project = new Project({
                name,
                description,
                color,
                owner: req.user._id,
                members: [{ user: req.user._id, role: "owner" }],
            })

            await project.save()
            res.status(201).json(project)
        } catch (error) {
            next(createError(400, "Error creating project"))
        }
    },

    // Update a project
    async updateProject(req, res, next) {
        try {
            const { name, description, color, status, startDate, endDate, team, tags, budget, customFields, settings } = req.body

            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user has permission to update
            if (!project.hasRole(req.user._id, ["owner", "admin"])) {
                return next(createError(403, "You don't have permission to update this project"))
            }

            // Update fields
            if (name) project.name = name
            if (description) project.description = description
            if (color) project.color = color
            if (status) project.status = status
            if (startDate) project.startDate = new Date(startDate)
            if (endDate) project.endDate = new Date(endDate)
            if (team) project.team = team
            if (Array.isArray(tags)) project.tags = tags
            if (budget) project.budget = budget
            if (Array.isArray(customFields)) project.customFields = customFields
            if (settings) project.settings = settings

            await project.save()
            res.json(project)
        } catch (error) {
            next(createError(400, "Error updating project"))
        }
    },

    // Delete a project
    async deleteProject(req, res, next) {
        try {
            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user is the owner
            if (project.owner.toString() !== req.user._id.toString()) {
                return next(createError(403, "Only the project owner can delete the project"))
            }

            // Delete all tasks associated with this project
            await Task.deleteMany({ project: project._id })

            // Delete the project
            await Project.deleteOne({ _id: project._id })

            res.json({ message: "Project deleted successfully" })
        } catch (error) {
            next(createError(500, "Error deleting project"))
        }
    },

    // Get tasks for a project
    async getProjectTasks(req, res, next) {
        try {
            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user has access to this project
            if (!project.hasAccess(req.user._id)) {
                return next(createError(403, "You don't have access to this project"))
            }

            const tasks = await Task.find({ project: project._id })
                .populate("assignedTo", "username email")
                .sort({ createdAt: -1 })

            res.json(tasks)
        } catch (error) {
            next(createError(500, "Error fetching project tasks"))
        }
    },

    // Add a member to a project
    async addProjectMember(req, res, next) {
        try {
            const { userId, role } = req.body

            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user has permission to add members
            if (!project.hasRole(req.user._id, ["owner", "admin"])) {
                return next(createError(403, "You don't have permission to add members"))
            }

            // Check if user is already a member
            const existingMember = project.members.find((member) => member.user.toString() === userId)
            if (existingMember) {
                return next(createError(400, "User is already a member of this project"))
            }

            // Add new member
            project.members.push({
                user: userId,
                role: role || "member",
            })

            await project.save()
            res.json(project)
        } catch (error) {
            next(createError(400, "Error adding project member"))
        }
    },

    // Remove a member from a project
    async removeProjectMember(req, res, next) {
        try {
            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user has permission to remove members
            if (!project.hasRole(req.user._id, ["owner", "admin"]) && req.user._id.toString() !== req.params.userId) {
                return next(createError(403, "You don't have permission to remove members"))
            }

            // Cannot remove the owner
            const isOwner = project.members.find(
                (member) => member.user.toString() === req.params.userId && member.role === "owner",
            )

            if (isOwner) {
                return next(createError(400, "Cannot remove the project owner"))
            }

            // Remove member
            project.members = project.members.filter((member) => member.user.toString() !== req.params.userId)

            await project.save()
            res.json(project)
        } catch (error) {
            next(createError(400, "Error removing project member"))
        }
    },

    // Update a member's role in a project
    async updateMemberRole(req, res, next) {
        try {
            const { role } = req.body

            if (!["admin", "member"].includes(role)) {
                return next(createError(400, "Invalid role"))
            }

            const project = await Project.findById(req.params.id)

            if (!project) {
                return next(createError(404, "Project not found"))
            }

            // Check if user is the owner
            if (project.owner.toString() !== req.user._id.toString()) {
                return next(createError(403, "Only the project owner can change member roles"))
            }

            // Cannot change owner's role
            if (project.owner.toString() === req.params.userId) {
                return next(createError(400, "Cannot change the owner's role"))
            }

            // Update member's role
            const memberIndex = project.members.findIndex((member) => member.user.toString() === req.params.userId)

            if (memberIndex === -1) {
                return next(createError(404, "Member not found"))
            }

            project.members[memberIndex].role = role
            await project.save()

            res.json(project)
        } catch (error) {
            next(createError(400, "Error updating member role"))
        }
    },
}

export default projectController
