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
      }
    });
    
    // Listen for new comment from client
    socket.on('newComment', async (data) => {
      // data: { taskId, comment, userId, username }
      // Save comment to DB (optional, handled elsewhere?)
      // Broadcast to task-specific room instead of globally
      if (data && data.taskId) {
        io.to(`task:${data.taskId}`).emit('newComment', data);
        
        // Also emit to notification channel for this task
        io.to(`notification:task:${data.taskId}`).emit('notification:new', {
          type: 'comment',
          content: `New comment on task: ${data.comment?.content?.substring(0, 30)}...`,
          taskId: data.taskId,
          sender: data.comment?.user || data.userId,
          timestamp: new Date()
        });
      } else {
        // Fallback to global broadcast if no taskId
        io.emit('newComment', data);
      }
    });
  });
}
