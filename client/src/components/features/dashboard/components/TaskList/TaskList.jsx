import { Box, Paper, Typography, Avatar } from "@mui/material"
import { formatDate } from "../../../../../utils/formatters"
import styles from "./TaskList.module.css"

const TaskList = ({ tasks }) => {
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
        <Paper key={task._id} className={`${styles.taskCard} ${getTaskBorderColor(task)}`}>
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
                Due: {formatDate(task.dueDate)}
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
                    {task.assignedTo.firstName || task.assignedTo.username}
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
