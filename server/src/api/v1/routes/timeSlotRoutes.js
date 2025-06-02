import express from 'express'
import TaskTimeSlotService from '../../../services/taskTimeSlotService.js'
import auth from '../../../middlewares/auth.js'
import { validateObjectId } from '../../../middlewares/validation.js'

const router = express.Router()

/**
 * @route POST /api/time-slots/:taskId/generate
 * @desc Generate daily time slots based on weekly pattern
 * @access Private
 */
router.post('/:taskId/generate', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId } = req.params
    const { startDate, endDate } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      })
    }

    const result = await TaskTimeSlotService.generateDailyTimeSlots(taskId, start, end)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error generating time slots:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route POST /api/time-slots/:taskId
 * @desc Add a single time slot to a task
 * @access Private
 */
router.post('/:taskId', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId } = req.params
    const timeSlotData = req.body

    const result = await TaskTimeSlotService.addTimeSlot(taskId, timeSlotData)
    
    res.status(201).json(result)
  } catch (error) {
    console.error('Error adding time slot:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route PUT /api/time-slots/:taskId/:slotId
 * @desc Update a time slot
 * @access Private
 */
router.put('/:taskId/:slotId', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId, slotId } = req.params
    const updateData = req.body

    const result = await TaskTimeSlotService.updateTimeSlot(taskId, slotId, updateData)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error updating time slot:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route DELETE /api/time-slots/:taskId/:slotId
 * @desc Delete a time slot
 * @access Private
 */
router.delete('/:taskId/:slotId', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId, slotId } = req.params

    const result = await TaskTimeSlotService.deleteTimeSlot(taskId, slotId)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error deleting time slot:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route POST /api/time-slots/:taskId/:slotId/complete
 * @desc Mark a time slot as completed
 * @access Private
 */
router.post('/:taskId/:slotId/complete', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId, slotId } = req.params
    const { actualStartTime, actualEndTime, notes } = req.body

    if (!actualStartTime || !actualEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Actual start time and end time are required'
      })
    }

    const result = await TaskTimeSlotService.completeTimeSlot(
      taskId, 
      slotId, 
      new Date(actualStartTime), 
      new Date(actualEndTime), 
      notes
    )
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error completing time slot:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route POST /api/time-slots/:taskId/:slotId/start
 * @desc Start time tracking for a slot
 * @access Private
 */
router.post('/:taskId/:slotId/start', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId, slotId } = req.params

    const result = await TaskTimeSlotService.startTimeTracking(taskId, slotId)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error starting time tracking:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route POST /api/time-slots/:taskId/:slotId/stop
 * @desc Stop time tracking for a slot
 * @access Private
 */
router.post('/:taskId/:slotId/stop', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId, slotId } = req.params
    const { notes } = req.body

    const result = await TaskTimeSlotService.stopTimeTracking(taskId, slotId, notes)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error stopping time tracking:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route GET /api/time-slots/:taskId/stats
 * @desc Get time tracking statistics for a task
 * @access Private
 */
router.get('/:taskId/stats', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId } = req.params

    const result = await TaskTimeSlotService.getTimeTrackingStats(taskId)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error getting time tracking stats:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route PUT /api/time-slots/:taskId/weekly-pattern
 * @desc Update weekly pattern for a task
 * @access Private
 */
router.put('/:taskId/weekly-pattern', auth.verifyToken, validateObjectId('taskId'), async (req, res) => {
  try {
    const { taskId } = req.params
    const weeklyPattern = req.body

    const result = await TaskTimeSlotService.updateWeeklyPattern(taskId, weeklyPattern)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error updating weekly pattern:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route GET /api/time-slots/user/:userId
 * @desc Get tasks with time slots for a user within a date range
 * @access Private
 */
router.get('/user/:userId', auth.verifyToken, validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const result = await TaskTimeSlotService.getTasksWithTimeSlots(userId, start, end)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error getting tasks with time slots:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @route GET /api/time-slots/schedule/:userId/:date
 * @desc Get daily schedule for a user
 * @access Private
 */
router.get('/schedule/:userId/:date', auth.verifyToken, validateObjectId('userId'), async (req, res) => {
  try {
    const { userId, date } = req.params

    const scheduleDate = new Date(date)
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      })
    }

    const result = await TaskTimeSlotService.getDailySchedule(userId, scheduleDate)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error getting daily schedule:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router