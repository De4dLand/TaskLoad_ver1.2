import Task from "../../../models/Task.js"
import Project from "../../../models/Project.js"
import { subDays, startOfDay, endOfDay, format } from "date-fns"

// Get activity data for the last N days
export const getActivityData = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error)
  }
}

// Get dashboard data: tasks and projects
export const getDashboardData = async (req, res, next) => {
  try {
    // Fetch tasks for user (created or assigned)
    const tasks = await Task.find({
      $or: [{ createdBy: req.user.userId }, { assignedTo: req.user.userId }],
    }).sort({ createdAt: -1 })
    // Fetch projects for user (owner or member)
    const projects = await Project.find({
      $or: [{ owner: req.user.userId }, { "members.user": req.user.userId }],
    }).sort({ updatedAt: -1 })
    return res.status(200).json({ tasks, projects })
  } catch (error) {
    next(error)
  }
}
