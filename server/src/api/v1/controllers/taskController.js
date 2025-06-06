import mongoose from "mongoose"
import Task from "../../../models/Task.js"
import Project from "../../../models/Project.js"
import { createError, catchAsync } from "../../../utils/error.js"
import redisClient from "../../../loaders/redis.js"
import { hasTaskAccess, canModifyTask, canDeleteTask } from "../../../utils/permissions.js"

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

export class TaskController {
  constructor() {
    // Constructor can be used for dependency injection if needed
  }

  // Get all subtasks for a task
  getSubtasks = catchAsync(async (req, res) => {
    const { taskId } = req.params;
    
    // Find the task and select only the subtasks
    const task = await Task.findById(taskId).select('subtasks');
    
    if (!task) {
      throw createError(404, 'Task not found');
    }
    
    // Check if user has access to this task
    if (!await hasTaskAccess(req.user, taskId)) {
      throw createError(403, 'You do not have permission to view these subtasks');
    }
    
    res.json({
      status: 'success',
      data: {
        subtasks: task.subtasks || []
      }
    });
  });

  // Add a new subtask to a task
  addSubtask = catchAsync(async (req, res) => {
    const { taskId } = req.params;
    const { title, completed = false } = req.body;
    
    // Validate input
    if (!title || typeof title !== 'string') {
      throw createError(400, 'Subtask title is required');
    }
    
    // Check if user has permission to modify this task
    if (!await canModifyTask(req.user, taskId)) {
      throw createError(403, 'You do not have permission to add subtasks to this task');
    }
    
    // Create new subtask
    const newSubtask = {
      _id: new mongoose.Types.ObjectId(),
      title,
      completed: Boolean(completed)
    };
    
    // Add subtask to the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $push: { subtasks: newSubtask } },
      { new: true, runValidators: true }
    ).select('subtasks');
    
    if (!updatedTask) {
      throw createError(404, 'Task not found');
    }
    
    // Get the newly added subtask (last one in the array)
    const addedSubtask = updatedTask.subtasks[updatedTask.subtasks.length - 1];
    
    // Invalidate cache for this task
    await invalidateCache(`task:${taskId}`);
    
    res.status(201).json({
      status: 'success',
      data: {
        subtask: addedSubtask
      }
    });
  });

  // Update an existing subtask
  updateSubtask = catchAsync(async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { title, completed } = req.body;
    
    // Validate input
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      throw createError(400, 'Subtask title cannot be empty');
    }
    
    if (completed !== undefined && typeof completed !== 'boolean') {
      throw createError(400, 'Completed must be a boolean');
    }
    
    // Check if user has permission to modify this task
    if (!await canModifyTask(req.user, taskId)) {
      throw createError(403, 'You do not have permission to modify this task');
    }
    
    // Build update object
    const update = {};
    if (title !== undefined) update['subtasks.$.title'] = title.trim();
    if (completed !== undefined) update['subtasks.$.completed'] = completed;
    
    // Update the subtask
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, 'subtasks._id': subtaskId },
      { $set: update },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      throw createError(404, 'Task or subtask not found');
    }
    
    // Find the updated subtask
    const updatedSubtask = updatedTask.subtasks.id(subtaskId);
    
    // Invalidate cache for this task
    await invalidateCache(`task:${taskId}`);
    
    res.json({
      status: 'success',
      data: {
        subtask: updatedSubtask
      }
    });
  });

  // Delete a subtask
  deleteSubtask = catchAsync(async (req, res) => {
    const { taskId, subtaskId } = req.params;
    
    // Check if user has permission to modify this task
    if (!await canModifyTask(req.user, taskId)) {
      throw createError(403, 'You do not have permission to modify this task');
    }
    
    // Remove the subtask
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { subtasks: { _id: subtaskId } } },
      { new: true }
    );
    
    if (!updatedTask) {
      throw createError(404, 'Task not found');
    }
    
    // Check if the subtask was actually removed
    const subtaskExists = updatedTask.subtasks.some(st => st._id.toString() === subtaskId);
    if (subtaskExists) {
      throw createError(404, 'Subtask not found');
    }
    
    // Invalidate cache for this task
    await invalidateCache(`task:${taskId}`);
    
    res.json({
      status: 'success',
      data: null,
      message: 'Subtask deleted successfully'
    });
  });

  // Toggle subtask completion status
  toggleSubtask = catchAsync(async (req, res) => {
    const { taskId, subtaskId } = req.params;
    
    // Check if user has permission to modify this task
    if (!await canModifyTask(req.user, taskId)) {
      throw createError(403, 'You do not have permission to modify this task');
    }
    
    // First get the current task to find the subtask's current status
    const task = await Task.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }
    
    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      throw createError(404, 'Subtask not found');
    }
    
    // Toggle the completed status
    subtask.completed = !subtask.completed;
    await task.save();
    
    // Invalidate cache for this task
    await invalidateCache(`task:${taskId}`);
    
    res.json({
      status: 'success',
      data: {
        subtask: subtask
      }
    });
  });
  
  // Get all tasks with filtering and pagination
  getTasks = catchAsync(async (req, res) => {
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
  });

  // Get a specific task by ID
  getTaskById = catchAsync(async (req, res) => {
    const { id } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, "Invalid task ID format")
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
      throw createError(404, "Task not found")
    }

    // Check permissions - user must be creator, assignee, or team member
    const isCreator = task.createdBy._id.toString() === req.user.userId
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user.userId

    if (!isCreator && !isAssignee) {
      // Check if user is part of the project team
      // You would need to implement this check based on your project model
      const isTeamMember = false // Placeholder

      if (!isTeamMember) {
        throw createError(403, "You don't have permission to view this task")
      }
    }

    // Set cache with 5 minute expiry for individual tasks
    await setCacheWithExpiry(cacheKey, task, 300)

    res.json(task)
  });


  // Create a new task
  createTask = catchAsync(async (req, res) => {
    const { title, description, status, priority, dueDate, startDate, project, assignedTo, tags, estimatedHours } = req.body

    // Get the current user ID from the request (set by auth middleware)
    const createdBy = req.user._id;

    // Validation
    if (!title) {
      throw createError(400, "Task title is required")
    }

    // Create task, omit assignedTo if empty to avoid cast errors
    const task = await Task.create({
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      startDate,
      project,
      tags: tags || [],
      estimatedHours,
      createdBy, // Use the createdBy from the authenticated user
      assignedTo: assignedTo || null
    })

    await task.save()

    // Populate references for response
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "username firstName lastName ")
      .populate("createdBy", "username firstName lastName")
      .populate("project", "name")

    // Invalidate user's task list cache
    await invalidateCache(`tasks:${req.user.userId}:*`)

    // If task is assigned to another user, invalidate their cache too
    if (assignedTo && assignedTo !== req.user.userId) {
      await invalidateCache(`tasks:${assignedTo}:*`)
    }

    res.status(201).json(populatedTask)
  });

  // Update an existing task
  updateTask = catchAsync(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, "Invalid task ID format")
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      throw createError(404, "Task not found")
    }
    
    // Get the project for permission checking
    const project = await Project.findById(task.project)
    if (!project) {
      throw createError(404, "Project not found")
    }
    
    // Robustly extract user ID from req.user
    const userId = req.user.userId || req.user.id || req.user._id;
    
    // Check permissions using the utility function
    if (!canModifyTask(task, userId, project)) {
      throw createError(403, "You don't have permission to update this task")
    }

    // List of fields that can be updated
    const allowedUpdates = [
      "title",
      "description",
      "status",
      "priority",
      "startDate",
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
      .populate("assignedTo", "username firstName lastName ")
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
  });

  // Delete a task
  deleteTask = catchAsync(async (req, res) => {
    const { id } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, "Invalid task ID format")
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      throw createError(404, "Task not found")
    }

    // Get the project for permission checking
    const project = await Project.findById(task.project)
    if (!project) {
      throw createError(404, "Project not found")
    }
    
    // Robustly extract user ID from req.user
    const userId = req.user.userId || req.user.id || req.user._id;
    
    // Check permissions using the utility function
    if (!canDeleteTask(task, userId, project)) {
      throw createError(403, "You don't have permission to delete this task")
    }

    // Store assignee ID before deleting for cache invalidation
    const assigneeId = task.assignedTo
    
    // Delete task
    await Task.findByIdAndDelete(id)

    // Invalidate related caches
    await invalidateCache(`task:${id}`)
    await invalidateCache(`tasks:${req.user.userId}:*`)

    // If task was assigned to another user, invalidate their cache too
    if (assigneeId && assigneeId.toString() !== req.user.userId) {
      await invalidateCache(`tasks:${assigneeId}:*`)
    }

    res.json({ message: "Task deleted successfully" })
  });



  // Get task statistics for the current user
  getTaskStats = catchAsync(async (req, res) => {
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
  });

  // Get recent tasks for the current user
  getRecentTasks = catchAsync(async (req, res) => {
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
  });

  // Get upcoming deadlines for the current user
  getUpcomingDeadlines = catchAsync(async (req, res) => {
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
  });

  // Get tasks within a date range
  getTasksByDateRange = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query
    const userId = req.user.userId

    if (!startDate || !endDate) {
      throw createError(400, "Both startDate and endDate are required")
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
  });

  // Update task status
  updateTaskStatus = catchAsync(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, "Invalid task ID format")
    }

    // Validate status
    if (!["todo", "in_progress", "review", "completed"].includes(status)) {
      throw createError(400, "Invalid status value")
    }

    // Find task
    const task = await Task.findById(id)

    if (!task) {
      throw createError(404, "Task not found")
    }

    // Check permissions - creator or assignee can update status
    const isCreator = task.createdBy.toString() === req.user.userId
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.userId

    if (!isCreator && !isAssignee) {
      throw createError(403, "You don't have permission to update this task's status")
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
  });
}

export default new TaskController();
