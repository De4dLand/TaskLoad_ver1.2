import { Box, Paper, Typography, Avatar, IconButton, Tooltip } from "@mui/material"
import { AccessTime as AccessTimeIcon, PriorityHigh as PriorityIcon, CheckCircleOutline as StatusIcon, WorkOutline as ProjectIcon } from '@mui/icons-material';
import { formatDate } from "../../../../../utils/formatters"
import styles from "./TaskList.module.css"

const calculateDaysRemaining = (dueDate) => {
  if (!dueDate) return '';
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = Math.abs(due - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return <span className={styles.daysRemaining}>Due Today</span>;
  }
  if (diffDays === 1) {
    return <span className={styles.daysRemaining}>1 day left</span>;
  }
  if (diffDays < 7) {
    return <span className={styles.daysRemaining}>{diffDays} days left</span>;
  }
  return `${diffDays} days left`;
};

const TaskList = ({ tasks, onTaskClick, onTaskContextMenu }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Paper className={styles.emptyState}>
        <Typography variant="body1" color="textSecondary">
          No tasks found. Create a new task to get started.
        </Typography>
      </Paper>
    )
  }

  const getTaskBorderColor = (task) => {
    switch (task.priority) {
      case "high":
        return styles.highPriorityTask
      case "medium":
        return styles.mediumPriorityTask
      case "low":
        return styles.lowPriorityTask
      default:
        return ""
    }
  }

  return (
    <Box className={styles.taskListContainer}>
      {tasks.map((task) => (
        <Paper
          key={task._id}
          className={`${styles.taskCard} ${getTaskBorderColor(task)}`}
          onClick={() => onTaskClick && onTaskClick(task)}
          onContextMenu={(e) => {
            e.preventDefault();
            onTaskContextMenu && onTaskContextMenu(e, task);
          }}
          style={{ cursor: 'pointer' }}
        >
          <Box className={styles.taskHeader}>
            <Typography variant="h6" className={styles.taskTitle}>
              {task.title}
            </Typography>
          </Box>

          <Typography variant="body2" className={styles.taskDescription}>
            {task.description}
          </Typography>

          <Box className={styles.taskFooter}>
            <Box className={styles.taskDueDate}>
              <Typography variant="caption" color="textSecondary">
                <AccessTimeIcon fontSize="small" sx={{ opacity: 0.7 }} />
                {task.dueDate ? (
                  <>
                    {calculateDaysRemaining(task.dueDate)}
                    <Typography variant="caption" color="textSecondary">
                      {` (${formatDate(task.dueDate)})`}
                    </Typography>
                  </>
                ) : (
                  'No Due Date'
                )}
              </Typography>
            </Box>

            <Box className={styles.taskPriority}>
              <PriorityIcon 
                fontSize="small" 
                sx={{ opacity: 0.7 }}
              />
              <Typography variant="caption">
                {task.priority || 'Low'}
              </Typography>
            </Box>

            <Box className={styles.taskStatus}>
              <StatusIcon 
                fontSize="small" 
                sx={{ opacity: 0.7 }}
              />
              <Typography variant="caption">
                {task.status || 'Open'}
              </Typography>
            </Box>

            <Box className={styles.taskProject}>
              <ProjectIcon 
                fontSize="small" 
                sx={{ opacity: 0.7 }}
              />
              <Typography variant="caption">
                {task.project?.name || 'No Project'}
              </Typography>
            </Box>

            <Box className={styles.taskAssignee}>
              {task.assignedTo && (
                <>
                  <Avatar
                    className={styles.assigneeAvatar}
                    alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                    src={task.assignedTo.profileImage}
                  >
                    {task.assignedTo.firstName?.charAt(0) || task.assignedTo.username?.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" className={styles.assigneeName}>
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}

export default TaskList
