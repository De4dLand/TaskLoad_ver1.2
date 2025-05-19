import express from 'express';
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

export default router;