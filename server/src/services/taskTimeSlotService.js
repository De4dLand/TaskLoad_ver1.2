import Task from '../models/Task.js'
import mongoose from 'mongoose'

/**
 * Service for managing task time slots and scheduling
 * This service handles the new time tracking fields added to the Task model
 */
class TaskTimeSlotService {
  /**
   * Generate daily time slots based on weekly pattern and date range
   * @param {string} taskId - Task ID
   * @param {Date} startDate - Start date for generating slots
   * @param {Date} endDate - End date for generating slots
   * @returns {Promise<Object>} Updated task with generated time slots
   */
  async generateDailyTimeSlots(taskId, startDate, endDate) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      if (!task.weeklyPattern.enabled) {
        throw new Error('Weekly pattern is not enabled for this task')
      }

      const { daysOfWeek, startTime, endTime } = task.weeklyPattern
      
      if (!daysOfWeek.length || !startTime || !endTime) {
        throw new Error('Weekly pattern is incomplete')
      }

      const newTimeSlots = []
      const currentDate = new Date(startDate)
      const endDateTime = new Date(endDate)

      // Generate time slots for each day in the range
      while (currentDate <= endDateTime) {
        const dayOfWeek = currentDate.getDay()
        
        // Check if this day is included in the weekly pattern
        if (daysOfWeek.includes(dayOfWeek)) {
          // Check if a slot already exists for this date
          const existingSlot = task.dailyTimeSlots.find(slot => 
            slot.date.toDateString() === currentDate.toDateString()
          )
          
          if (!existingSlot) {
            newTimeSlots.push({
              date: new Date(currentDate),
              startTime: startTime,
              endTime: endTime,
              isCompleted: false
            })
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Add new time slots to the task
      task.dailyTimeSlots.push(...newTimeSlots)
      
      // Sort time slots by date
      task.dailyTimeSlots.sort((a, b) => a.date - b.date)
      
      await task.save()
      
      return {
        success: true,
        message: `Generated ${newTimeSlots.length} time slots`,
        task: task,
        generatedSlots: newTimeSlots.length
      }
    } catch (error) {
      throw new Error(`Failed to generate daily time slots: ${error.message}`)
    }
  }

  /**
   * Add a single time slot to a task
   * @param {string} taskId - Task ID
   * @param {Object} timeSlotData - Time slot data
   * @returns {Promise<Object>} Updated task
   */
  async addTimeSlot(taskId, timeSlotData) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      // Validate required fields
      if (!timeSlotData.date || !timeSlotData.startTime || !timeSlotData.endTime) {
        throw new Error('Date, start time, and end time are required')
      }

      // Check if a slot already exists for this date and time
      const existingSlot = task.dailyTimeSlots.find(slot => {
        const sameDate = slot.date.toDateString() === new Date(timeSlotData.date).toDateString()
        const sameTime = slot.startTime === timeSlotData.startTime && slot.endTime === timeSlotData.endTime
        return sameDate && sameTime
      })

      if (existingSlot) {
        throw new Error('A time slot already exists for this date and time')
      }

      // Add the new time slot
      task.dailyTimeSlots.push({
        date: new Date(timeSlotData.date),
        startTime: timeSlotData.startTime,
        endTime: timeSlotData.endTime,
        isCompleted: false,
        notes: timeSlotData.notes || ''
      })

      // Sort time slots by date
      task.dailyTimeSlots.sort((a, b) => a.date - b.date)
      
      await task.save()
      
      return {
        success: true,
        message: 'Time slot added successfully',
        task: task
      }
    } catch (error) {
      throw new Error(`Failed to add time slot: ${error.message}`)
    }
  }

  /**
   * Update a time slot
   * @param {string} taskId - Task ID
   * @param {string} slotId - Time slot ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  async updateTimeSlot(taskId, slotId, updateData) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const timeSlot = task.dailyTimeSlots.id(slotId)
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      // Update allowed fields
      if (updateData.startTime !== undefined) timeSlot.startTime = updateData.startTime
      if (updateData.endTime !== undefined) timeSlot.endTime = updateData.endTime
      if (updateData.notes !== undefined) timeSlot.notes = updateData.notes
      if (updateData.date !== undefined) timeSlot.date = new Date(updateData.date)

      await task.save()
      
      return {
        success: true,
        message: 'Time slot updated successfully',
        task: task,
        updatedSlot: timeSlot
      }
    } catch (error) {
      throw new Error(`Failed to update time slot: ${error.message}`)
    }
  }

  /**
   * Delete a time slot
   * @param {string} taskId - Task ID
   * @param {string} slotId - Time slot ID
   * @returns {Promise<Object>} Updated task
   */
  async deleteTimeSlot(taskId, slotId) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const timeSlot = task.dailyTimeSlots.id(slotId)
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      // Remove the time slot
      task.dailyTimeSlots.pull(slotId)
      await task.save()
      
      return {
        success: true,
        message: 'Time slot deleted successfully',
        task: task
      }
    } catch (error) {
      throw new Error(`Failed to delete time slot: ${error.message}`)
    }
  }

  /**
   * Mark a time slot as completed with actual times
   * @param {string} taskId - Task ID
   * @param {string} slotId - Time slot ID
   * @param {Date} actualStartTime - Actual start time
   * @param {Date} actualEndTime - Actual end time
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated task
   */
  async completeTimeSlot(taskId, slotId, actualStartTime, actualEndTime, notes = '') {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const timeSlot = task.dailyTimeSlots.id(slotId)
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      if (actualStartTime >= actualEndTime) {
        throw new Error('Actual start time must be before actual end time')
      }

      timeSlot.isCompleted = true
      timeSlot.actualStartTime = actualStartTime
      timeSlot.actualEndTime = actualEndTime
      if (notes) timeSlot.notes = notes

      await task.save()
      
      return {
        success: true,
        message: 'Time slot marked as completed',
        task: task,
        completedSlot: timeSlot
      }
    } catch (error) {
      throw new Error(`Failed to complete time slot: ${error.message}`)
    }
  }

  /**
   * Start a time tracking session for a slot
   * @param {string} taskId - Task ID
   * @param {string} slotId - Time slot ID
   * @returns {Promise<Object>} Updated task with started session
   */
  async startTimeTracking(taskId, slotId) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const timeSlot = task.dailyTimeSlots.id(slotId)
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      if (timeSlot.isCompleted) {
        throw new Error('Time slot is already completed')
      }

      if (timeSlot.actualStartTime) {
        throw new Error('Time tracking already started for this slot')
      }

      timeSlot.actualStartTime = new Date()
      await task.save()
      
      return {
        success: true,
        message: 'Time tracking started',
        task: task,
        startedAt: timeSlot.actualStartTime
      }
    } catch (error) {
      throw new Error(`Failed to start time tracking: ${error.message}`)
    }
  }

  /**
   * Stop a time tracking session
   * @param {string} taskId - Task ID
   * @param {string} slotId - Time slot ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated task with stopped session
   */
  async stopTimeTracking(taskId, slotId, notes = '') {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const timeSlot = task.dailyTimeSlots.id(slotId)
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      if (!timeSlot.actualStartTime) {
        throw new Error('Time tracking was not started for this slot')
      }

      if (timeSlot.isCompleted) {
        throw new Error('Time slot is already completed')
      }

      timeSlot.actualEndTime = new Date()
      timeSlot.isCompleted = true
      if (notes) timeSlot.notes = notes

      await task.save()
      
      const duration = (timeSlot.actualEndTime - timeSlot.actualStartTime) / (1000 * 60) // minutes
      
      return {
        success: true,
        message: 'Time tracking stopped',
        task: task,
        duration: Math.round(duration * 100) / 100, // rounded to 2 decimal places
        completedSlot: timeSlot
      }
    } catch (error) {
      throw new Error(`Failed to stop time tracking: ${error.message}`)
    }
  }

  /**
   * Get time tracking statistics for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Time tracking statistics
   */
  async getTimeTrackingStats(taskId) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const stats = {
        totalSlots: task.dailyTimeSlots.length,
        completedSlots: task.dailyTimeSlots.filter(slot => slot.isCompleted).length,
        pendingSlots: task.dailyTimeSlots.filter(slot => !slot.isCompleted).length,
        totalScheduledHours: task.timeTracking.totalScheduledHours,
        totalCompletedHours: task.timeTracking.totalCompletedHours,
        averageSessionDuration: task.timeTracking.averageSessionDuration,
        lastWorkedDate: task.timeTracking.lastWorkedDate,
        completionRate: task.dailyTimeSlots.length > 0 
          ? Math.round((task.dailyTimeSlots.filter(slot => slot.isCompleted).length / task.dailyTimeSlots.length) * 100)
          : 0,
        upcomingSlots: task.dailyTimeSlots
          .filter(slot => !slot.isCompleted && slot.date >= new Date())
          .sort((a, b) => a.date - b.date)
          .slice(0, 5), // Next 5 upcoming slots
        recentCompletedSlots: task.dailyTimeSlots
          .filter(slot => slot.isCompleted)
          .sort((a, b) => b.date - a.date)
          .slice(0, 5) // Last 5 completed slots
      }

      return {
        success: true,
        stats: stats
      }
    } catch (error) {
      throw new Error(`Failed to get time tracking stats: ${error.message}`)
    }
  }

  /**
   * Update weekly pattern for a task
   * @param {string} taskId - Task ID
   * @param {Object} weeklyPattern - Weekly pattern configuration
   * @returns {Promise<Object>} Updated task
   */
  async updateWeeklyPattern(taskId, weeklyPattern) {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      // Validate weekly pattern
      if (weeklyPattern.enabled) {
        if (!weeklyPattern.daysOfWeek || !weeklyPattern.daysOfWeek.length) {
          throw new Error('Days of week must be specified when weekly pattern is enabled')
        }
        
        if (!weeklyPattern.startTime || !weeklyPattern.endTime) {
          throw new Error('Start time and end time must be specified when weekly pattern is enabled')
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(weeklyPattern.startTime) || !timeRegex.test(weeklyPattern.endTime)) {
          throw new Error('Time must be in HH:MM format (24-hour)')
        }

        // Validate start time is before end time
        const startMinutes = this._timeToMinutes(weeklyPattern.startTime)
        const endMinutes = this._timeToMinutes(weeklyPattern.endTime)
        if (startMinutes >= endMinutes) {
          throw new Error('Start time must be before end time')
        }
      }

      task.weeklyPattern = weeklyPattern
      await task.save()
      
      return {
        success: true,
        message: 'Weekly pattern updated successfully',
        task: task
      }
    } catch (error) {
      throw new Error(`Failed to update weekly pattern: ${error.message}`)
    }
  }

  /**
   * Get tasks with time slots for a user within a date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Tasks with time slots in the date range
   */
  async getTasksWithTimeSlots(userId, startDate, endDate) {
    try {
      const tasks = await Task.find({
        $or: [
          { assignedTo: userId },
          { createdBy: userId }
        ],
        'dailyTimeSlots.date': {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .lean()

      // Filter time slots to only include those in the date range
      const filteredTasks = tasks.map(task => ({
        ...task,
        dailyTimeSlots: task.dailyTimeSlots.filter(slot => 
          slot.date >= startDate && slot.date <= endDate
        )
      }))

      return {
        success: true,
        tasks: filteredTasks
      }
    } catch (error) {
      throw new Error(`Failed to get tasks with time slots: ${error.message}`)
    }
  }

  /**
   * Get daily schedule for a user
   * @param {string} userId - User ID
   * @param {Date} date - Date to get schedule for
   * @returns {Promise<Object>} Daily schedule
   */
  async getDailySchedule(userId, date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const tasks = await Task.find({
        $or: [
          { assignedTo: userId },
          { createdBy: userId }
        ],
        'dailyTimeSlots.date': {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .populate('assignedTo', 'name email')
      .populate('project', 'name color')
      .lean()

      // Extract and format time slots for the specific date
      const schedule = []
      
      tasks.forEach(task => {
        const daySlots = task.dailyTimeSlots.filter(slot => {
          const slotDate = new Date(slot.date)
          return slotDate >= startOfDay && slotDate <= endOfDay
        })
        
        daySlots.forEach(slot => {
          schedule.push({
            slotId: slot._id,
            taskId: task._id,
            taskTitle: task.title,
            project: task.project,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isCompleted: slot.isCompleted,
            actualStartTime: slot.actualStartTime,
            actualEndTime: slot.actualEndTime,
            notes: slot.notes,
            priority: task.priority,
            status: task.status
          })
        })
      })

      // Sort by start time
      schedule.sort((a, b) => {
        const aMinutes = this._timeToMinutes(a.startTime)
        const bMinutes = this._timeToMinutes(b.startTime)
        return aMinutes - bMinutes
      })

      return {
        success: true,
        date: date,
        schedule: schedule,
        totalSlots: schedule.length,
        completedSlots: schedule.filter(slot => slot.isCompleted).length
      }
    } catch (error) {
      throw new Error(`Failed to get daily schedule: ${error.message}`)
    }
  }

  /**
   * Helper method to convert time string to minutes
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Minutes since midnight
   */
  _timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }
}

export default new TaskTimeSlotService()