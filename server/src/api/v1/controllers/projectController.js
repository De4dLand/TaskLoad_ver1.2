import Project from "../../../models/Project.js"
import Task from "../../../models/Task.js"
import { createError, catchAsync } from "../../../utils/error.js"
import { hasProjectPermission } from "../../../utils/permissions.js"

class ProjectController {
    // Get all projects for current user
    getUserProjects = catchAsync(async (req, res) => {
        const projects = await Project.find({
            $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
        })
        .populate('owner', 'username firstName lastName email profileImage')
        .populate('members.user', 'username firstName lastName email profileImage')
        .populate('tasks', 'title status priority dueDate')
        .sort({ updatedAt: -1 })

        res.json(projects)
    });

    // Get a specific project
    getProjectById = catchAsync(async (req, res) => {
        const project = await Project.findById(req.params.id)
            .populate("owner", "username firstName lastName email profileImage")
            .populate("members.user", "username firstName lastName email profileImage")
            .populate("tasks", "title description status priority dueDate assignedTo createdBy")

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user has access to this project using the utility function
        const userId = req.user._id.toString();
        if (!hasProjectPermission(project, userId, ['owner', 'admin', 'member', 'supervisor'])) {
            throw createError(403, "You don't have access to this project")
        }

        res.json(project)
    });

    // Create a new project
    createProject = catchAsync(async (req, res) => {
        const { name, description, color, template } = req.body

        const project = new Project({
            name,
            description,
            color,
            template, // Save template if provided
            owner: req.user._id,
            members: [{ user: req.user._id, role: "owner" }],
        })

        await project.save()
        res.status(201).json(project)
    });

    // Update a project
    updateProject = catchAsync(async (req, res) => {
        const { name, description, color, status, startDate, endDate, team, tags, budget, customFields, settings } = req.body

        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user has permission to update using the utility function
        const userId = req.user._id.toString();
        if (!hasProjectPermission(project, userId, ['owner', 'admin'])) {
            throw createError(403, "You don't have permission to update this project")
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
    });

    // Delete a project
    deleteProject = catchAsync(async (req, res) => {
        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user is the owner using the utility function
        const userId = req.user._id.toString();
        if (!hasProjectPermission(project, userId, ['owner'])) {
            throw createError(403, "Only the project owner can delete the project")
        }

        // Delete all tasks associated with this project
        await Task.deleteMany({ project: project._id })

        // Delete the project
        await Project.deleteOne({ _id: project._id })

        res.json({ message: "Project deleted successfully" })
    });

    // Get tasks for a project
    getProjectTasks = catchAsync(async (req, res) => {
        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user has access to this project using the utility function
        const userId = req.user._id.toString();
        if (!hasProjectPermission(project, userId, ['owner', 'admin', 'member', 'supervisor'])) {
            throw createError(403, "You don't have access to this project")
        }

        const tasks = await Task.find({ project: project._id })
            .populate("assignedTo", "username firstName lastName email profileImage")
            .populate("createdBy", "username firstName lastName email profileImage")
            .populate("project", "name color")
            .sort({ createdAt: -1 })

        res.json(tasks)
    });

    // Add a member to a project
    addProjectMember = catchAsync(async (req, res) => {
        const { userId, role } = req.body

        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user has permission to add members using the utility function
        const currentUserId = req.user._id.toString();
        if (!hasProjectPermission(project, currentUserId, ['owner', 'admin'])) {
            throw createError(403, "You don't have permission to add members")
        }

        // Check if user is already a member
        const existingMember = project.members.find((member) => member.user.toString() === userId)
        if (existingMember) {
            throw createError(400, "User is already a member of this project")
        }

        // Add new member
        project.members.push({
            user: userId,
            role: role || "member",
        })

        await project.save()
        res.json(project)
    });

    // Remove a member from a project
    removeProjectMember = catchAsync(async (req, res) => {
        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user has permission to remove members or is removing themselves
        const currentUserId = req.user._id.toString();
        const isRemovingSelf = currentUserId === req.params.userId;
        
        if (!isRemovingSelf && !hasProjectPermission(project, currentUserId, ['owner', 'admin'])) {
            throw createError(403, "You don't have permission to remove members")
        }

        // Cannot remove the owner
        const isOwner = project.members.find(
            (member) => member.user.toString() === req.params.userId && member.role === "owner",
        )

        if (isOwner) {
            throw createError(400, "Cannot remove the project owner")
        }

        // Remove member
        project.members = project.members.filter((member) => member.user.toString() !== req.params.userId)

        await project.save()
        res.json(project)
    });

    // Update a member's role in a project
    updateMemberRole = catchAsync(async (req, res) => {
        const { role } = req.body

        if (!['admin', 'member', 'supervisor'].includes(role)) {
            throw createError(400, "Invalid role")
        }

        const project = await Project.findById(req.params.id)

        if (!project) {
            throw createError(404, "Project not found")
        }

        // Check if user is the owner using the utility function
        const userId = req.user._id.toString();
        if (!hasProjectPermission(project, userId, ['owner'])) {
            throw createError(403, "Only the project owner can change member roles")
        }

        // Cannot change owner's role
        if (project.owner.toString() === req.params.userId) {
            throw createError(400, "Cannot change the owner's role")
        }

        // Update member's role
        const memberIndex = project.members.findIndex((member) => member.user.toString() === req.params.userId)

        if (memberIndex === -1) {
            throw createError(404, "Member not found")
        }

        project.members[memberIndex].role = role
        await project.save()

        res.json(project)
    });
}

export default new ProjectController();
