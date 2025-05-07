import mongoose from 'mongoose';

/**
 * Handles all notification-related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 * @param {Map} onlineUsers - Map of online users (userId -> socketId)
 */
export default function notificationHandler(io, socket, onlineUsers) {
  // Subscribe to notification channels
  socket.on('notification:subscribe', ({ channels }) => {
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.join(`notification:${channel}`);
      });
      console.log(`Socket ${socket.id} subscribed to notification channels:`, channels);
    }
  });

  // Unsubscribe from notification channels
  socket.on('notification:unsubscribe', ({ channels }) => {
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.leave(`notification:${channel}`);
      });
      console.log(`Socket ${socket.id} unsubscribed from notification channels:`, channels);
    }
  });

  // Mark notification as read
  socket.on('notification:markRead', async ({ notificationId, userId }) => {
    try {
      if (!notificationId || !userId) {
        socket.emit('notification:error', { error: 'Invalid notification data' });
        return;
      }

      // Update notification in database
      await import('../../services/notificationService.js')
        .then(module => module.default.markAsRead(notificationId, userId))
        .catch(err => {
          console.error('Error importing notification service:', err);
          throw new Error('Failed to mark notification as read');
        });

      // Confirm to the user that notification was marked as read
      socket.emit('notification:marked', { notificationId, status: 'read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('notification:error', { error: 'Failed to update notification status' });
    }
  });

  // Send a notification to specific users or channels
  socket.on('notification:send', async (notificationData) => {
    try {
      const { type, recipients, content, metadata = {} } = notificationData;
      
      if (!type || !recipients || !content) {
        socket.emit('notification:error', { error: 'Invalid notification data' });
        return;
      }

      // Create notification object
      const notification = {
        _id: new mongoose.Types.ObjectId(),
        type,
        content,
        metadata,
        createdAt: new Date(),
        read: []
      };

      // Save notification to database
      const savedNotification = await import('../../services/notificationService.js')
        .then(module => module.default.createNotification(notification))
        .catch(err => {
          console.error('Error importing notification service:', err);
          return notification; // Fallback to original notification if service fails
        });

      // Send to specific users
      if (Array.isArray(recipients.users)) {
        recipients.users.forEach(userId => {
          // Check if user is online
          const socketId = onlineUsers.get(userId);
          if (socketId) {
            // Send directly to the user's socket
            io.to(socketId).emit('notification:new', notification);
          } else {
            // User is offline, will see notification when they log in
            // This could be handled by database queries when user logs in
          }
        });
      }

      // Send to channels
      if (Array.isArray(recipients.channels)) {
        recipients.channels.forEach(channel => {
          io.to(`notification:${channel}`).emit('notification:new', notification);
        });
      }

      // Confirm to sender
      socket.emit('notification:sent', { success: true, notificationId: notification._id });
    } catch (error) {
      console.error('Error sending notification:', error);
      socket.emit('notification:error', { error: 'Failed to send notification' });
    }
  });

  // Get unread notifications count
  socket.on('notification:getUnreadCount', async ({ userId }) => {
    try {
      if (!userId) {
        socket.emit('notification:error', { error: 'Invalid user ID' });
        return;
      }

      // Get count from database
      const count = await import('../../services/notificationService.js')
        .then(module => module.default.getUnreadCount(userId))
        .catch(err => {
          console.error('Error importing notification service:', err);
          return 0; // Fallback to 0 if service fails
        });

      socket.emit('notification:unreadCount', { count });
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      socket.emit('notification:error', { error: 'Failed to get unread count' });
    }
  });
}