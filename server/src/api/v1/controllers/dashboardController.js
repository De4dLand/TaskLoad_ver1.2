import Task from "../../../models/Task.js"
import redisClient from "../../../loaders/redis.js"
import { subDays, startOfDay, endOfDay, format } from "date-fns"

// Get activity data for the last N days
export const getActivityData = async (req, res, next) => {
  try {
    const { days = 7 } = req.query
    const daysNum = Number.parseInt(days)

    // Check Redis cache
    const cacheKey = `activityData:${req.user.userId}:${daysNum}`
    const cachedData = await redisClient.get(cacheKey)

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

    // Cache results
    await redisClient.set(cacheKey, JSON.stringify(activityData), "EX", 60 * 60) // 1 hour

    res.status(200).json(activityData)
  } catch (error) {
    next(error)
  }
}

