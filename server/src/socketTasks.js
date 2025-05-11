import Task from './models/Task.js';

/**
 * Checks for tasks with deadlines within the next X minutes and emits notifications to users.
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 * @param {number} minutesAhead - Number of minutes ahead to check for deadlines.
 */
export async function emitDeadlineWarnings(io, minutesAhead = 60) {
  const now = new Date();
  const soon = new Date(now.getTime() + minutesAhead * 60000);
  // Find tasks whose dueDate is within the next X minutes and not completed
  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: soon },
    status: { $ne: 'completed' },
  }).populate('assignedTo');

  for (const task of tasks) {
    if (task.assignedTo) {
      // Emit to a room or directly to the user if you have user-specific rooms
      io.emit('deadlineWarning', {
        taskId: task._id,
        title: task.title,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo._id,
        assignedToName: task.assignedTo.username,
      });
    }
  }
}

/**
 * Handles real-time comment events.
 * @param {import('socket.io').Server} io
 */
export function handleCommentEvents(io) {
  // Track users who are currently typing in each task
  const typingUsers = new Map(); // taskId -> Set of {userId, username}
  
  io.on('connection', (socket) => {
    // Join task-specific room for comments
    socket.on('task:join', ({ taskId }) => {
      if (taskId) {
        socket.join(`task:${taskId}`);
        console.log(`Socket ${socket.id} joined task room: ${taskId}`);
      }
    });
    
    // Leave task-specific room
    socket.on('task:leave', ({ taskId }) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
        console.log(`Socket ${socket.id} left task room: ${taskId}`);
        
        // Clean up typing status when user leaves the task
        if (socket.userId && typingUsers.has(taskId)) {
          const taskTypers = typingUsers.get(taskId);
          const updatedTypers = [...taskTypers].filter(user => user.userId !== socket.userId);
          typingUsers.set(taskId, new Set(updatedTypers));
          
          // Notify others that this user stopped typing
          io.to(`task:${taskId}`).emit('comment:typingUpdate', {
            taskId,
            typingUsers: [...updatedTypers]
          });
        }
      }
    });
    
    // Store user info when they authenticate
    socket.on('user:login', (userData) => {
      if (userData && userData.userId) {
        socket.userId = userData.userId;
        socket.username = userData.username || 'Anonymous';
      }
    });
    
    // Listen for new comment from client
    socket.on('newComment', async (data) => {
      try {
        // data: { taskId, comment, userId, username }
        if (data && data.taskId) {
          // Save comment to database using commentService
          const commentService = await import('./services/commentService.js')
            .then(module => module.default)
            .catch(err => {
              console.error('Error importing comment service:', err);
              return null;
            });
          
          if (commentService) {
            await commentService.addComment(data.taskId, data.comment);
          }
          
          // Broadcast to task-specific room
          io.to(`task:${data.taskId}`).emit('newComment', data);
          
          // Also emit to notification channel for this task
          io.to(`notification:task:${data.taskId}`).emit('notification:new', {
            type: 'comment',
            content: `New comment on task: ${data.comment?.content?.substring(0, 30)}...`,
            taskId: data.taskId,
            sender: data.comment?.user || data.userId,
            timestamp: new Date()
          });
          
          // Clear typing indicator for this user
          if (socket.userId && typingUsers.has(data.taskId)) {
            const taskTypers = typingUsers.get(data.taskId);
            const updatedTypers = [...taskTypers].filter(user => user.userId !== socket.userId);
            typingUsers.set(data.taskId, new Set(updatedTypers));
            
            // Notify others that this user stopped typing
            io.to(`task:${data.taskId}`).emit('comment:typingUpdate', {
              taskId: data.taskId,
              typingUsers: [...updatedTypers]
            });
          }
        } else {
          // Fallback to global broadcast if no taskId
          io.emit('newComment', data);
        }
      } catch (error) {
        console.error('Error handling new comment:', error);
        socket.emit('comment:error', { error: 'Failed to save comment' });
      }
    });
    
    // Handle typing indicator events
    socket.on('comment:typing', ({ taskId, isTyping, userId, username }) => {
      if (!taskId) return;
      
      // Initialize typing users set for this task if it doesn't exist
      if (!typingUsers.has(taskId)) {
        typingUsers.set(taskId, new Set());
      }
      
      const taskTypers = typingUsers.get(taskId);
      const userInfo = { userId: userId || socket.userId, username: username || socket.username };
      
      if (isTyping) {
        // Add user to typing set
        taskTypers.add(userInfo);
      } else {
        // Remove user from typing set
        taskTypers.forEach(user => {
          if (user.userId === (userId || socket.userId)) {
            taskTypers.delete(user);
          }
        });
      }
      
      // Broadcast typing status to all users in the task room
      io.to(`task:${taskId}`).emit('comment:typingUpdate', {
        taskId,
        typingUsers: [...taskTypers]
      });
    });
    
    // Get comments for a task
    socket.on('comment:getAll', async ({ taskId }) => {
      try {
        if (!taskId) {
          socket.emit('comment:error', { error: 'Invalid task ID' });
          return;
        }
        
        const commentService = await import('./services/commentService.js')
          .then(module => module.default)
          .catch(err => {
            console.error('Error importing comment service:', err);
            return null;
          });
        
        if (commentService) {
          const comments = await commentService.getComments(taskId);
          socket.emit('comment:allComments', { taskId, comments });
        } else {
          socket.emit('comment:error', { error: 'Comment service unavailable' });
        }
      } catch (error) {
        console.error('Error getting comments:', error);
        socket.emit('comment:error', { error: 'Failed to retrieve comments' });
      }
    });
    
    // Delete a comment
    socket.on('comment:delete', async ({ taskId, commentId }) => {
      try {
        if (!taskId || !commentId) {
          socket.emit('comment:error', { error: 'Invalid task or comment ID' });
          return;
        }
        
        const commentService = await import('./services/commentService.js')
          .then(module => module.default)
          .catch(err => {
            console.error('Error importing comment service:', err);
            return null;
          });
        
        if (commentService) {
          await commentService.deleteComment(taskId, commentId);
          
          // Notify all users in the task room about the deleted comment
          io.to(`task:${taskId}`).emit('comment:deleted', { taskId, commentId });
          
          socket.emit('comment:deleteSuccess', { taskId, commentId });
        } else {
          socket.emit('comment:error', { error: 'Comment service unavailable' });
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        socket.emit('comment:error', { error: 'Failed to delete comment' });
      }
    });
  });
}
