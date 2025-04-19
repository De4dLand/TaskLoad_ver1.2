import Task from "../../../models/Task.js"
import Project from "../../../models/Project.js" // Import Project model
import { createError } from "../../../utils/error.js"
import redisClient from "../../../loaders/redis.js"
import mongoose from "mongoose"

// Helper function to set cache with expiration
const setCacheWithExpiry = async (key, data, ttl = 3600) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.set(key, JSON.stringify(data), {
        EX: ttl,
      })
    }
  } catch (error) {
    console.error("Redis cache error:", error)
  }
}

// Helper function to get cached data
const getCachedData = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const cachedData = await redisClient.get(key)
      return cachedData ? JSON.parse(cachedData) : null
    }
    return null
  } catch (error) {
    console.error("Redis cache error:", error)
    return null
  }
}

// Helper function to invalidate cache keys with pattern
const invalidateCache = async (pattern) => {
  try {
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error)
  }
}

export const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      search,
      project,
      team,
      assignedTo,
      dueDate,
      startDate,
      endDate,
      sort = "dueDate",
      order = "asc",
      page = 1,
      limit = 10,
    } = req.query

    // Build cache key based on query parameters
    const cacheKey = `tasks:${req.user.userId}:${JSON.stringify(req.query)}`

    // Try to get from cache
    const cachedTasks = await getCachedData(cacheKey)
    if (cachedTasks) {
      return res.json(cachedTasks)
    }

    // Build query
    const query = {}

    // Filter by user's access - tasks either created by user or assigned to user
    query.$or = [{ createdBy: req.user.userId }, { assignedTo: req.user.userId }]

    // Apply filters
    if (status) {
      query.status = status
    }

    if (priority) {
      query.priority = priority
    }

    if (project) {
      query.project = project
    }

    if (team) {
      // Find projects belonging to this team
      const teamProjects = await Project.find({ team }).select("_id")
      const projectIds = teamProjects.map((p) => p._id)
      query.project = { $in: projectIds }
    }

    if (assignedTo === "me") {
      query.assignedTo = req.user.userId
    } else if (assignedTo) {
      query.assignedTo = assignedTo
    }

    // Date filters
    if (dueDate) {
      // Specific due date
      const date = new Date(dueDate)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))
      query.dueDate = { $gte: startOfDay, $lte: endOfDay }
    } else {
      // Date range
      if (startDate) {
        query.dueDate = { ...query.dueDate, $gte: new Date(startDate) }
      }

      if (endDate) {
        query.dueDate = { ...query.dueDate, $lte: new Date(endDate) }
      }
    }

    // Text search
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Pagination
    const skip = (page - 1) * limit

    // Sort configuration
    const sortConfig = {}
    sortConfig[sort] = order === "asc" ? 1 : -1

    // Execute query with pagination and sorting
    const tasks = await Task.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Get total count for pagination
    const total = await Task.countDocuments(query)

    const result = {
      tasks,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    }

    // Set cache
    await setCacheWithExpiry(cacheKey, result)

    res.json(result)
  } catch (error) {
    next(createError(500, `Error fetching tasks: ${error.message}`))
  }
}

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid task ID format"))
    }

    // Try to get from cache
    const cacheKey = `task:${id}`
    const cachedTask = await getCachedData(cacheKey)

    if (cachedTask) {
      return res.json(cachedTask)
    }

    const task = await Task.findById(id)
      .populate("assignedTo", "username firstName lastName profileImage email")
      .populate("createdBy", "username firstName lastName email")
      .populate("project", "name")
      .populate({
        path: "comments.user",
        select: "username firstName lastName profileImage",
      })

    if (!task) {
      return next(createError(404, "Task not found"))
    }

    // Check permissions - user must be creator, assignee, or team member
    const isCreator = task.createdBy._id.toString() === req.user.userId
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user.userId

    if (!isCreator && !isAssignee) {
      // Check if user is part of the project team
      // You would need to implement this check based on your project model
      const isTeamMember = false // Placeholder

      if (!isTeamMember) {
        return next(createError(403, "You don't have permission to view this task"))
      }
    }

    // Set cache with 5 minute expiry for individual tasks
    await setCacheWithExpiry(cacheKey, task, 300)

    res.json(task)
  } catch (error) {
    next(createError(500, `Error fetching task: ${error.message}`))
  }
}

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project, assignedTo, tags, estimatedHours } = req.body

    // Validation
    if (!title) {
      return next(createError(400, "Task title is required"))
    }

    // Create task, omit assignedTo if empty to avoid cast errors
    const taskData = {
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      project,
      tags: tags || [],
      estimatedHours,
      createdBy: req.user._id,
    };
    if (assignedTo !== "") {
      taskData.assignedTo = assignedTo;
    }
    else{
      taskData.assignedTo = req.user._id
    }
    const task = new Task(taskData);

    await task.save()

    // Populate references for response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Invalidate user's task list cache
    await invalidateCache(`tasks:${req.user.userId}:*`)

    // If task is assigned to another user, invalidate their cache too
    if (assignedTo && assignedTo !== req.user.userId) {
      await invalidateCache(`tasks:${assignedTo}:*`)
    }

    res.status(201).json(populatedTask)
  } catch (error) {
    next(createError(400, `Error creating task: ${error.message}`))
  }
}

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid task ID format"))
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      return next(createError(404, "Task not found"))
    }

    // Check permissions - only creator or assignee can update
    const isCreator = task.createdBy.toString() === req.user.userId
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.userId

    if (!isCreator && !isAssignee) {
      return next(createError(403, "You don't have permission to update this task"))
    }

    // List of fields that can be updated
    const allowedUpdates = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "assignedTo",
      "tags",
      "estimatedHours",
      "actualHours",
      "subtasks",
    ]

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field]
      }
    })

    await task.save()

    // Populate for response
    const updatedTask = await Task.findById(id)
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Invalidate related caches
    await invalidateCache(`task:${id}`)
    await invalidateCache(`tasks:${req.user.userId}:*`)

    // If task is assigned to or was assigned to another user, invalidate their cache too
    if (task.assignedTo && task.assignedTo.toString() !== req.user.userId) {
      await invalidateCache(`tasks:${task.assignedTo}:*`)
    }

    if (updateData.assignedTo && updateData.assignedTo !== req.user.userId) {
      await invalidateCache(`tasks:${updateData.assignedTo}:*`)
    }

    res.json(updatedTask)
  } catch (error) {
    next(createError(400, `Error updating task: ${error.message}`))
  }
}

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid task ID format"))
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      return next(createError(404, "Task not found"))
    }

    // Check permissions - only creator can delete
    if (task.createdBy.toString() !== req.user.userId) {
      return next(createError(403, "Only the task creator can delete this task"))
    }

    // Store assignee ID before deleting for cache invalidation
    const assigneeId = task.assignedTo

    // Delete the task
    await Task.findByIdAndDelete(id)

    // Invalidate related caches
    await invalidateCache(`task:${id}`)
    await invalidateCache(`tasks:${req.user.userId}:*`)

    // If task was assigned to another user, invalidate their cache too
    if (assigneeId && assigneeId.toString() !== req.user.userId) {
      await invalidateCache(`tasks:${assigneeId}:*`)
    }

    res.json({ message: "Task deleted successfully" })
  } catch (error) {
    next(createError(500, `Error deleting task: ${error.message}`))
  }
}

export const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Try to get from cache
    const cacheKey = `taskStats:${userId}`
    const cachedStats = await getCachedData(cacheKey)

    if (cachedStats) {
      return res.json(cachedStats)
    }

    // Calculate today's date boundaries
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Calculate upcoming week
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // User's tasks (created or assigned)
    const userQuery = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    }

    // Stats calculations
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueNotCompleted,
      dueTodayNotCompleted,
      dueThisWeekNotCompleted,
    ] = await Promise.all([
      Task.countDocuments(userQuery),
      Task.countDocuments({ ...userQuery, status: "completed" }),
      Task.countDocuments({ ...userQuery, status: "in_progress" }),
      Task.countDocuments({ ...userQuery, status: "todo" }),
      Task.countDocuments({
        ...userQuery,
        status: { $ne: "completed" },
        dueDate: { $lt: today },
      }),
      Task.countDocuments({
        ...userQuery,
        status: { $ne: "completed" },
        dueDate: { $gte: today, $lt: tomorrow },
      }),
      Task.countDocuments({
        ...userQuery,
        status: { $ne: "completed" },
        dueDate: { $gte: today, $lt: nextWeek },
      }),
    ])

    // Get tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: userQuery },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ])

    // Format priority data
    const priorityStats = {
      high: 0,
      medium: 0,
      low: 0,
    }

    tasksByPriority.forEach((item) => {
      priorityStats[item._id] = item.count
    })

    const stats = {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks,
      overdue: overdueNotCompleted,
      dueToday: dueTodayNotCompleted,
      dueThisWeek: dueThisWeekNotCompleted,
      byPriority: priorityStats,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    }

    // Cache stats for 1 hour
    await setCacheWithExpiry(cacheKey, stats, 3600)

    res.json(stats)
  } catch (error) {
    next(createError(500, `Error fetching task statistics: ${error.message}`))
  }
}

export const getRecentTasks = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query
    const userId = req.user.userId

    // Try to get from cache
    const cacheKey = `recentTasks:${userId}:${limit}`
    const cachedTasks = await getCachedData(cacheKey)

    if (cachedTasks) {
      return res.json(cachedTasks)
    }

    // User's tasks (created or assigned)
    const userQuery = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    }

    // Get recent tasks sorted by creation date
    const tasks = await Task.find(userQuery)
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Cache recent tasks for 5 minutes
    await setCacheWithExpiry(cacheKey, tasks, 300)

    res.json(tasks)
  } catch (error) {
    next(createError(500, `Error fetching recent tasks: ${error.message}`))
  }
}

export const getUpcomingDeadlines = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query
    const userId = req.user.userId

    // Try to get from cache
    const cacheKey = `upcomingDeadlines:${userId}:${limit}`
    const cachedDeadlines = await getCachedData(cacheKey)

    if (cachedDeadlines) {
      return res.json(cachedDeadlines)
    }

    // Calculate today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // User's incomplete tasks with upcoming deadlines
    const query = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      status: { $ne: "completed" },
      dueDate: { $gte: today },
    }

    // Get upcoming deadlines sorted by due date
    const tasks = await Task.find(query)
      .sort({ dueDate: 1 })
      .limit(Number.parseInt(limit))
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Cache upcoming deadlines for 10 minutes
    await setCacheWithExpiry(cacheKey, tasks, 600)

    res.json(tasks)
  } catch (error) {
    next(createError(500, `Error fetching upcoming deadlines: ${error.message}`))
  }
}

export const getTasksByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.userId

    if (!startDate || !endDate) {
      return next(createError(400, "Both startDate and endDate are required"))
    }

    // Try to get from cache
    const cacheKey = `tasksByDateRange:${userId}:${startDate}:${endDate}`
    const cachedTasks = await getCachedData(cacheKey)

    if (cachedTasks) {
      return res.json(cachedTasks)
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    // End of day for end date
    end.setHours(23, 59, 59, 999)

    // User's tasks within date range
    const query = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      dueDate: { $gte: start, $lte: end },
    }

    // Get tasks in date range
    const tasks = await Task.find(query)
      .sort({ dueDate: 1 })
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Cache tasks for 15 minutes
    await setCacheWithExpiry(cacheKey, tasks, 900)

    res.json(tasks)
  } catch (error) {
    next(createError(500, `Error fetching tasks by date range: ${error.message}`))
  }
}

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid task ID format"))
    }

    // Validate status
    if (!["todo", "in_progress", "review", "completed"].includes(status)) {
      return next(createError(400, "Invalid status value"))
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      return next(createError(404, "Task not found"))
    }

    // Check permissions - creator or assignee can update status
    const isCreator = task.createdBy.toString() === req.user.userId
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.userId

    if (!isCreator && !isAssignee) {
      return next(createError(403, "You don't have permission to update this task's status"))
    }

    // Update status
    task.status = status
    await task.save()

    // Populate for response
    const updatedTask = await Task.findById(id)
      .populate("assignedTo", "username firstName lastName profileImage")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Invalidate related caches
    await invalidateCache(`task:${id}`)
    await invalidateCache(`tasks:${req.user.userId}:*`)
    await invalidateCache(`taskStats:${req.user.userId}`)

    // If task is assigned to another user, invalidate their cache too
    if (task.assignedTo && task.assignedTo.toString() !== req.user.userId) {
      await invalidateCache(`tasks:${task.assignedTo}:*`)
      await invalidateCache(`taskStats:${task.assignedTo}`)
    }

    res.json(updatedTask)
  } catch (error) {
    next(createError(400, `Error updating task status: ${error.message}`))
  }
}
