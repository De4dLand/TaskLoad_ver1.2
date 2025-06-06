import express from 'express';
import mongoose from 'mongoose';
import auth from '../../../middlewares/auth.js';
import { checkResourceOwnership } from '../../../utils/permissionMiddleware.js';
import NotificationService from '../../../services/notificationService.js';

const router = express.Router();

// Apply authentication middleware to all notification routes
router.use(auth.verifyToken);

/**
 * @route GET /api/v1/notifications
 * @desc Get all notifications for the current user
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await NotificationService.getUserNotifications(userId);
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/notifications/unread
 * @desc Get unread notifications for the current user
 * @access Private
 */
router.get('/unread', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await NotificationService.getUnreadNotifications(userId);
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/notifications/count
 * @desc Get unread notifications count for the current user
 * @access Private
 */
router.get('/count', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await NotificationService.getUnreadNotificationsCount(userId);
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/v1/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:id/read', checkResourceOwnership('Notification'), async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    
    await NotificationService.markAsRead(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/v1/notifications/read-all
 * @desc Mark all notifications as read for the current user
 * @access Private
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = req.user._id;
    await NotificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', checkResourceOwnership('Notification'), async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    await NotificationService.deleteNotification(notificationId);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/notifications/custom
 * @desc Create a custom notification for project members
 * @access Private
 */
router.post('/custom', async (req, res, next) => {
  try {
    const { projectId, content, recipients, metadata } = req.body;
    const senderId = req.user._id;
    
    if (!projectId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and content are required'
      });
    }
    
    // Check if user has permission to send notifications for this project
    const Project = mongoose.model('Project');
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is a member of the project
    const isMember = project.members.some(
      member => member.user.toString() === senderId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send notifications for this project'
      });
    }
    
    const notification = await NotificationService.createCustomNotification(
      senderId,
      projectId,
      content,
      recipients,
      metadata
    );
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/notifications/check-due-dates
 * @desc Manually trigger due date notification check (admin only)
 * @access Private/Admin
 */
router.post('/check-due-dates', auth.isAdmin, async (req, res, next) => {
  try {
    const notifications = await NotificationService.checkDueDateNotifications();
    
    res.status(200).json({
      success: true,
      message: `Created ${notifications.length} due date notifications`,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

export default router;