"use client"

import { useState, useEffect } from "react"
import {
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material"
import { Add } from "@mui/icons-material"
import TaskList from "../components/TaskList"
import TaskForm from "../components/TaskForm"
import { getTasks, createTask, updateTask, deleteTask } from "../services/taskService"

const TaskListPage = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [selectedTask, setSelectedTask] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getTasks()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setFormMode("create")
    setSelectedTask(null)
    setFormOpen(true)
  }

  const handleEditClick = (task) => {
    setFormMode("edit")
    setSelectedTask(task)
    setFormOpen(true)
  }

  const handleDeleteClick = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task._id !== taskId))
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true)

      if (formMode === "create") {
        const newTask = await createTask(formData)
        setTasks([newTask, ...tasks])
      } else {
        const updatedTask = await updateTask(selectedTask._id, formData)
        setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
      }

      setFormOpen(false)
    } catch (error) {
      console.error("Failed to save task:", error)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tasks</Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleCreateClick}>
          New Task
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TaskList tasks={tasks} onEdit={handleEditClick} onDelete={handleDeleteClick} />
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === "create" ? "Create New Task" : "Edit Task"}</DialogTitle>
        <DialogContent>
          <TaskForm initialValues={selectedTask || {}} onSubmit={handleFormSubmit} loading={formLoading} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default TaskListPage
