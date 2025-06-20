import { find, findOne, create, findOneAndUpdate, findOneAndDelete } from "../models/Task"
import mongoose from 'mongoose';
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
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the task
    const task = await create(taskData);

    // Update project's tasks array if project is specified
    if (taskData.project) {
      const Project = mongoose.model('Project');
      await Project.findByIdAndUpdate(
        taskData.project,
        { $addToSet: { tasks: task._id } },
        { new: true, session }
      );
    }

    // Update user's tasks arrays
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      taskData.user,
      {
        $addToSet: {
          tasks: task._id,
          createdTasks: task._id
        }
      },
      { session }
    );

    if (taskData.assignedTo) {
      await User.findByIdAndUpdate(
        taskData.assignedTo,
        { $addToSet: { assignedTasks: task._id } },
        { session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();

    // Invalidate cache
    await deleteCache(taskData.user);

    return task;
  } catch (error) {
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
}

export async function updateTask(taskId, updateData, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the original task to check for changes
    const originalTask = await findOne({ _id: taskId, user: userId });
    if (!originalTask) {
      throw new Error('Task not found');
    }

    const task = await findOneAndUpdate(
      { _id: taskId, user: userId },
      updateData,
      { new: true, runValidators: true, session }
    );

    // Handle project changes
    if (updateData.project && originalTask.project?.toString() !== updateData.project.toString()) {
      const Project = mongoose.model('Project');

      // Remove task from old project
      if (originalTask.project) {
        await Project.findByIdAndUpdate(
          originalTask.project,
          { $pull: { tasks: taskId } },
          { session }
        );
      }

      // Add task to new project
      await Project.findByIdAndUpdate(
        updateData.project,
        { $addToSet: { tasks: taskId } },
        { session }
      );
    }

    // Handle assignee changes
    if (updateData.assignedTo && originalTask.assignedTo?.toString() !== updateData.assignedTo.toString()) {
      const User = mongoose.model('User');

      // Remove task from old assignee
      if (originalTask.assignedTo) {
        await User.findByIdAndUpdate(
          originalTask.assignedTo,
          { $pull: { assignedTasks: taskId } },
          { session }
        );
      }

      // Add task to new assignee
      await User.findByIdAndUpdate(
        updateData.assignedTo,
        { $addToSet: { assignedTasks: taskId } },
        { session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();

    // Invalidate cache
    await deleteCache(userId);

    return task;
  } catch (error) {
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
}

export async function deleteTask(taskId, userId) {
  const task = await findOne({ _id: taskId, user: userId });
  if (!task) {
    return false;
  }

  // Remove task reference from project
  if (task.project) {
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(
      task.project,
      { $pull: { tasks: taskId } }
    );
  }

  // Remove task references from users
  const User = mongoose.model('User');

  // Remove from creator's tasks and createdTasks
  await User.findByIdAndUpdate(
    task.user,
    {
      $pull: {
        tasks: taskId,
        createdTasks: taskId
      }
    }
  );

  // Remove from assignee's assignedTasks
  if (task.assignedTo) {
    await User.findByIdAndUpdate(
      task.assignedTo,
      { $pull: { assignedTasks: taskId } }
    );
  }

  // Delete the task
  const result = await findOneAndDelete({ _id: taskId, user: userId });

  // Invalidate cache
  await deleteCache(userId);

  return !!result;
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

