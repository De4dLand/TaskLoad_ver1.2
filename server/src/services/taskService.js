import { find, findOne, create, findOneAndUpdate, findOneAndDelete } from "../models/Task"
import { redisClient } from "../loaders/redis"

// Helper function to get cache key
const getCacheKey = (userId, type, value = "") => {
  return `tasks:${userId}:${type}:${value}`
}

// Helper function to set cache
const setCache = async (key, data, ttl = 3600) => {
  if (redisClient && redisClient.isReady) {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl })
  }
}

// Helper function to get cache
const getCache = async (key) => {
  if (redisClient && redisClient.isReady) {
    const cachedData = await redisClient.get(key)
    return cachedData ? JSON.parse(cachedData) : null
  }
  return null
}

// Helper function to delete cache
const deleteCache = async (userId) => {
  if (redisClient && redisClient.isReady) {
    const keys = await redisClient.keys(`tasks:${userId}:*`)
    if (keys.length > 0) {
      await redisClient.del(keys)
    }
  }
}

export async function getAllTasks(userId) {
  // Try to get from cache
  const cacheKey = getCacheKey(userId, "all")
  const cachedTasks = await getCache(cacheKey)

  if (cachedTasks) {
    return cachedTasks
  }

  // If not in cache, get from database
  const tasks = await find({ user: userId }).sort({ createdAt: -1 })

  // Set cache
  await setCache(cacheKey, tasks)

  return tasks
}

export async function getTaskById(taskId, userId) {
  const task = await findOne({ _id: taskId, user: userId })
  return task
}

export async function createTask(taskData) {
  const task = await create(taskData)

  // Invalidate cache
  await deleteCache(taskData.user)

  return task
}

export async function updateTask(taskId, updateData, userId) {
  const task = await findOneAndUpdate({ _id: taskId, user: userId }, updateData, {
    new: true,
    runValidators: true,
  })

  // Invalidate cache
  await deleteCache(userId)

  return task
}

export async function deleteTask(taskId, userId) {
  const result = await findOneAndDelete({ _id: taskId, user: userId })

  // Invalidate cache
  await deleteCache(userId)

  return !!result
}

export async function getTasksByStatus(status, userId) {
  // Try to get from cache
  const cacheKey = getCacheKey(userId, "status", status)
  const cachedTasks = await getCache(cacheKey)

  if (cachedTasks) {
    return cachedTasks
  }

  // If not in cache, get from database
  const tasks = await find({
    user: userId,
    completed: status === "completed",
  }).sort({ createdAt: -1 })

  // Set cache
  await setCache(cacheKey, tasks)

  return tasks
}

export async function getTasksByPriority(priority, userId) {
  // Try to get from cache
  const cacheKey = getCacheKey(userId, "priority", priority)
  const cachedTasks = await getCache(cacheKey)

  if (cachedTasks) {
    return cachedTasks
  }

  // If not in cache, get from database
  const tasks = await find({
    user: userId,
    priority,
  }).sort({ createdAt: -1 })

  // Set cache
  await setCache(cacheKey, tasks)

  return tasks
}

