import Task from "../../../models/Task.js"
import Project from "../../../models/Project.js"
import { subDays, startOfDay, endOfDay, format } from "date-fns"
import { catchAsync } from "../../../utils/error.js"

export class DashboardController {
  // Get activity data for the last N days
  getActivityData = catchAsync(async (req, res) => {
    const { days = 7 } = req.query
    const daysNum = Number.parseInt(days)

    // Access Redis from app locals
    const redis = req.app.locals.redis
    const cacheKey = `activityData:${req.user.userId}:${daysNum}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData))
    }

    const today = new Date()
    const activityData = []

    // Generate data for each day
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      // Count tasks created on this day
      const created = await Task.countDocuments({
        user: req.user.userId,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      })

      // Count tasks completed on this day
      const completed = await Task.countDocuments({
        user: req.user.userId,
        completed: true,
        updatedAt: { $gte: dayStart, $lte: dayEnd },
      })

      activityData.push({
        date: format(date, "MMM d"),
        created,
        completed,
      })
    }

    // Cache results (1 hour)
    await redis.set(cacheKey, JSON.stringify(activityData), "EX", 60 * 60)

    res.status(200).json(activityData)
  });

  // Get dashboard data: tasks and projects
  getDashboardData = catchAsync(async (req, res) => {
    const { currentUserOnly = false } = req.query
    
    // Fetch tasks for user (created or assigned)
    const taskQuery = {
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    }
    
    const tasks = await Task.find(taskQuery)
      .populate('project', 'name color')
      .populate('assignedTo', 'username firstName lastName profileImage')
      .populate('createdBy', 'username firstName lastName profileImage')
      .sort({ createdAt: -1 })

    // Fetch projects for user (owner or member)
    const projectQuery = {
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    }
    
    const projects = await Project.find(projectQuery)
      .populate('owner', 'username firstName lastName email profileImage')
      .populate('members.user', 'username firstName lastName email profileImage')
      .populate('tasks', 'title status priority dueDate')
      .sort({ updatedAt: -1 })

    return res.status(200).json({ tasks, projects })
  });
}

export default new DashboardController();
