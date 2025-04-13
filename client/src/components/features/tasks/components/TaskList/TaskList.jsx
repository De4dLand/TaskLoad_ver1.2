"use client"
import { Link } from "react-router-dom"
import { Paper, List, ListItem, ListItemText, Chip, IconButton, Typography, Box } from "@mui/material"
import { Edit, Delete, Assignment } from "@mui/icons-material"
import styles from "./TaskList.module.css"

const TaskList = ({ tasks = [], onEdit = () => {}, onDelete = () => {} }) => {
  if (tasks.length === 0) {
    return (
      <Paper className={styles.emptyState}>
        <Assignment fontSize="large" color="disabled" />
        <Typography variant="h6" color="textSecondary">
          No tasks found
        </Typography>
      </Paper>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "default"
      case "in_progress":
        return "primary"
      case "review":
        return "info"
      case "completed":
        return "success"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "info"
      default:
        return "default"
    }
  }

  return (
    <Paper>
      <List>
        {tasks.map((task) => (
          <ListItem key={task._id} divider className={styles.listItem}>
            <ListItemText
              primary={
                <Link to={`/tasks/${task._id}`} className={styles.taskLink}>
                  {task.title}
                </Link>
              }
              secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
            />
            <Box className={styles.chipContainer}>
              <Chip size="small" label={task.status} color={getStatusColor(task.status)} className={styles.chip} />
              <Chip
                size="small"
                label={task.priority}
                color={getPriorityColor(task.priority)}
                variant="outlined"
                className={styles.chip}
              />
            </Box>
            <Box>
              <IconButton size="small" onClick={() => onEdit(task)}>
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(task._id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default TaskList
