"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Typography, Paper, Box, Chip, Button, Grid, Divider, CircularProgress, IconButton } from "@mui/material"
import { Edit, Delete, ArrowBack } from "@mui/icons-material"
import { getTaskById, deleteTask } from "../services/taskService"

const TaskDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTaskDetails()
  }, [id])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      const data = await getTaskById(id)
      setTask(data)
    } catch (error) {
      console.error("Failed to fetch task details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    // Navigate to edit task page or open modal
    // For now, we'll just log
    console.log("Edit task:", id)
  }

  const handleDelete = async () => {
    try {
      await deleteTask(id)
      navigate("/tasks")
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (!task) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>Task not found</Typography>
      </Paper>
    )
  }

  return (
    <div>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate("/tasks")} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Task Details</Typography>
      </Box>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h5" gutterBottom>
            {task.title}
          </Typography>
          <Box>
            <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit} sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
          <Chip label={task.priority} color={getPriorityColor(task.priority)} variant="outlined" size="small" />
          {task.dueDate && (
            <Chip label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`} variant="outlined" size="small" />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Description</Typography>
            <Typography variant="body1">{task.description || "No description provided"}</Typography>
          </Grid>

          {task.assignedTo && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Assigned To</Typography>
              <Typography variant="body1">{task.assignedTo.username || "Unknown"}</Typography>
            </Grid>
          )}

          {task.createdBy && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Created By</Typography>
              <Typography variant="body1">{task.createdBy.username || "Unknown"}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </div>
  )
}

export default TaskDetailPage
