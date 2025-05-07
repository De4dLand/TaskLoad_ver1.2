import mongoose from 'mongoose';

/**
 * Handles all time tracking related socket events
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Socket instance for the current connection
 */
export default function timeTrackingHandler(io, socket) {
  // Start tracking time for a task
  socket.on('timeTracking:start', async (data) => {
    try {
      const { userId, taskId, projectId, startTime = new Date() } = data;
      
      if (!userId || (!taskId && !projectId)) {
        socket.emit('timeTracking:error', { error: 'Invalid time tracking data' });
        return;
      }

      // Create time tracking session
      const timeSession = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        taskId,
        projectId,
        startTime,
        endTime: null,
        duration: 0,
        isActive: true
      };

      // Save time tracking session to database
      const savedSession = await import('../../services/timeTrackingService.js')
        .then(module => module.default.startSession(timeSession))
        .catch(err => {
          console.error('Error importing time tracking service:', err);
          return timeSession; // Fallback to original session if service fails
        });

      // Emit back to the user who started tracking
      socket.emit('timeTracking:started', {
        sessionId: timeSession._id,
        startTime: timeSession.startTime
      });

      // Notify project members that someone started working (optional)
      if (projectId) {
        socket.to(`project:${projectId}`).emit('timeTracking:memberStarted', {
          userId,
          taskId,
          projectId,
          startTime
        });
      }
    } catch (error) {
      console.error('Error starting time tracking:', error);
      socket.emit('timeTracking:error', { error: 'Failed to start time tracking' });
    }
  });

  // Stop tracking time for a task
  socket.on('timeTracking:stop', async (data) => {
    try {
      const { sessionId, userId, endTime = new Date() } = data;
      
      if (!sessionId || !userId) {
        socket.emit('timeTracking:error', { error: 'Invalid time tracking data' });
        return;
      }

      // Update time tracking session in database
      const updatedSession = await import('../../services/timeTrackingService.js')
        .then(module => module.default.stopSession(sessionId, endTime))
        .catch(err => {
          console.error('Error importing time tracking service:', err);
          // Fallback if service fails
          return {
            _id: sessionId,
            userId,
            endTime,
            duration: 0,
            isActive: false
          };
        });

      // Emit back to the user who stopped tracking
      socket.emit('timeTracking:stopped', {
        sessionId: updatedSession._id,
        endTime: updatedSession.endTime,
        duration: updatedSession.duration
      });

      // Notify project members that someone stopped working (optional)
      if (updatedSession.projectId) {
        socket.to(`project:${updatedSession.projectId}`).emit('timeTracking:memberStopped', {
          userId,
          taskId: updatedSession.taskId,
          projectId: updatedSession.projectId,
          duration: updatedSession.duration
        });
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      socket.emit('timeTracking:error', { error: 'Failed to stop time tracking' });
    }
  });

  // Update current time tracking status (heartbeat)
  socket.on('timeTracking:heartbeat', async (data) => {
    try {
      const { sessionId, userId, currentTime = new Date() } = data;
      
      if (!sessionId || !userId) {
        return; // Silent fail for heartbeats
      }

      // Update last activity time in database
      await import('../../services/timeTrackingService.js')
        .then(module => module.default.updateHeartbeat(sessionId, currentTime))
        .catch(err => {
          console.error('Error importing time tracking service:', err);
          // Silent fail for heartbeats
        });

      // No need to emit anything back for heartbeats
    } catch (error) {
      console.error('Error updating time tracking heartbeat:', error);
      // Silent fail for heartbeats
    }
  });

  // Get active time tracking sessions for a user
  socket.on('timeTracking:getActive', async ({ userId }) => {
    try {
      if (!userId) {
        socket.emit('timeTracking:error', { error: 'Invalid user ID' });
        return;
      }

      // Get active sessions from database
      const activeSessions = await import('../../services/timeTrackingService.js')
        .then(module => module.default.getActiveSessions(userId))
        .catch(err => {
          console.error('Error importing time tracking service:', err);
          return []; // Fallback to empty array if service fails
        });

      socket.emit('timeTracking:activeSessions', { sessions: activeSessions });
    } catch (error) {
      console.error('Error getting active time tracking sessions:', error);
      socket.emit('timeTracking:error', { error: 'Failed to get active sessions' });
    }
  });

  // Join project room for time tracking updates
  socket.on('project:join', ({ projectId }) => {
    if (projectId) {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
    }
  });

  // Leave project room
  socket.on('project:leave', ({ projectId }) => {
    if (projectId) {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project room: ${projectId}`);
    }
  });
}