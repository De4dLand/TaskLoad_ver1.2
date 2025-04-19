"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule } from "@mui/icons-material"
import TaskList from "../components/TaskList/TaskList"
import TaskGrid from "../components/TaskGrid/TaskGrid"
import ProjectSidebar from "../components/ProjectSidebar/ProjectSidebar"
import DataNotFound from "../../../common/DataNotFound"
import { fetchDashboardData, createProject, createTask, updateTask, deleteTask } from "../services/dashboardService"
import useAuth from "../../../../hooks/useAuth"
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Menu, MenuItem } from "@mui/material"
import FormInput from "../../../common/FormInput"
import styles from "./DashboardPage.module.css"

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("list")
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
  const [selectedTask, setSelectedTask] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [contextTask, setContextTask] = useState(null)

  if (authLoading) return (<Box className={styles.loadingContainer}><CircularProgress /></Box>)
  if (!user) return (<Box className={styles.loadingContainer}>Please login to view dashboard.</Box>)

  // Load data helper
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchDashboardData()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
      setError("Failed to load data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Handlers for creation
  const handleAddProject = async () => {
    const name = prompt("Enter new project name:")
    if (!name) return
    const description = prompt("Enter project description:")
    const color = prompt("Enter project color (HEX, e.g. #1976d2):", "#1976d2")
    try {
      await createProject({ name, description, color, owner: user._id })
      loadData()
    } catch (err) {
      console.error("Error creating project:", err)
    }
  }
  const handleAddTask = () => {
    setSelectedTask(null)
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
    setTaskDialogOpen(true)
  }

  // Task dialog handlers
  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false)
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
  }
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target
    setTaskForm(prev => ({ ...prev, [name]: name === "tags" ? value.split(",").map(tag => tag.trim()) : value }))
  }
  const handleDateChange = (date) => {
    setTaskForm(prev => ({ ...prev, dueDate: date }))
  }
  const handleTaskFormSubmit = async () => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask._id, taskForm)
      } else {
        await createTask(taskForm)
      }
      loadData()
      handleCloseTaskDialog()
    } catch (err) {
      console.error(selectedTask ? "Error updating task:" : "Error creating task:", err)
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      project: task.project._id || task.project || "",
      assignedTo: task.assignedTo?._id || null,
      tags: task.tags || [],
      estimatedHours: task.estimatedHours || ""
    })
    setTaskDialogOpen(true)
  }

  const handleTaskContextMenu = (event, task) => {
    event.preventDefault()
    setContextTask(task)
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    )
  }

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView)
    }
  }

  if (loading) return (<Box className={styles.loadingContainer}><CircularProgress /></Box>)

  // if (error) {
  //   return <DataNotFound message={error} />
  // }

  // if (dashboardData && dashboardData.projects.length === 0) {
  //   return <DataNotFound message="No projects found" />
  // }

  return (
    <Box className={styles.dashboardContainer}>
      <Typography variant="subtitle1" className={styles.greeting}>
        Hello, {user.username}
      </Typography>
      <Box className={styles.sidebarContainer}>
        <Button fullWidth variant="outlined" onClick={handleAddProject} sx={{ mb:2 }}>+ Add Project</Button>
        {dashboardData?.projects && <ProjectSidebar sidebarData={dashboardData} />}
      </Box>

      <Box className={styles.contentContainer}>
        <Box className={styles.contentHeader}>
          <Typography variant="h5" component="h1" className={styles.pageTitle}>
            My Tasks
          </Typography>

          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} aria-label="view mode" size="small">
            <ToggleButton value="list" aria-label="list view">
              <ViewList /> List View
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModule /> Grid View
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" size="small" onClick={handleAddTask} sx={{ ml:2 }}>+ Add Task</Button>
        </Box>

        {dashboardData?.tasks && (
          <Box className={styles.tasksContainer}>
            {viewMode === "list"
              ? <TaskList tasks={dashboardData.tasks} onTaskClick={handleEditTask} onTaskContextMenu={handleTaskContextMenu} />
              : <TaskGrid tasks={dashboardData.tasks} onTaskClick={handleEditTask} onTaskContextMenu={handleTaskContextMenu} />}
          </Box>
        )}
      </Box>
      {/*Add new tasks to projects*/}
      <Dialog open={taskDialogOpen} onClose={handleCloseTaskDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <FormInput name="title" label="Title" value={taskForm.title} onChange={handleTaskFormChange} required />
            <FormInput type="textarea" name="description" label="Description" value={taskForm.description} onChange={handleTaskFormChange} rows={4} />
            <FormInput type="select" name="status" label="Status" value={taskForm.status} onChange={handleTaskFormChange} options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'review', label: 'Review' },
              { value: 'completed', label: 'Completed' },
            ]} required />
            <FormInput type="select" name="priority" label="Priority" value={taskForm.priority} onChange={handleTaskFormChange} options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]} required />
            <FormInput type="date" name="dueDate" label="Due Date" value={taskForm.dueDate || ''} onChange={handleTaskFormChange} />
            <FormInput type="select" name="project" label="Project" value={taskForm.project} onChange={handleTaskFormChange} options={dashboardData.projects.map(proj => ({ value: proj._id, label: proj.name }))} required />
            <FormInput type="number" name="estimatedHours" label="Estimated Hours" value={taskForm.estimatedHours} onChange={handleTaskFormChange} />
            <FormInput name="tags" label="Tags (comma separated)" value={taskForm.tags.join(',')} onChange={handleTaskFormChange} helperText="Separate tags with commas" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleTaskFormSubmit}>
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Context menu for tasks */}
      <Menu
        open={contextMenu !== null}
        onClose={() => { setContextMenu(null); setContextTask(null); }}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => { handleEditTask(contextTask); setContextMenu(null); }}>Edit</MenuItem>
        <MenuItem onClick={() => { deleteTask(contextTask._id).then(() => loadData()); setContextMenu(null); }}>Delete</MenuItem>
      </Menu>
    </Box>
  )
}

export default DashboardPage
