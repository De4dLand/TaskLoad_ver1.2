import { Grid, Paper, Typography, Avatar, Box } from "@mui/material"
import { formatDate } from "../../../../../utils/formatters"
import styles from "./TaskGrid.module.css"

const TaskGrid = ({ tasks }) => {
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
    <Grid container spacing={3}>
      {tasks.map((task) => (
        <Grid item xs={12} sm={6} md={4} key={task._id}>
          <Paper className={`${styles.taskCard} ${getTaskBorderColor(task)}`}>
            <Typography variant="h6" className={styles.taskTitle}>
              {task.title}
            </Typography>

            <Typography variant="body2" className={styles.taskDescription}>
              {task.description}
            </Typography>

            <Box className={styles.taskFooter}>
              <Typography variant="caption" color="textSecondary">
                Due: {formatDate(task.dueDate)}
              </Typography>

              {task.assignedTo && (
                <Box className={styles.taskAssignee}>
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
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

export default TaskGrid
