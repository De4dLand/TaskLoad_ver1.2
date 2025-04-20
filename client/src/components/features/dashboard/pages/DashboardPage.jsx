"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule, CalendarToday, Timeline, BarChart } from "@mui/icons-material"
import TaskList from "../components/TaskList/TaskList"
import TaskGrid from "../components/TaskGrid/TaskGrid"
import ProjectSidebar from "../components/ProjectSidebar/ProjectSidebar"
import DataNotFound from "../../../common/DataNotFound"
import { fetchDashboardData, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask, addProjectMember, searchUsers } from "../services/dashboardService"
import useAuth from "../../../../hooks/useAuth"
import FilterView from "../components/FilterView/FilterView"
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Menu, MenuItem, TextField } from "@mui/material"
import FormInput from "../../../common/FormInput"
import styles from "./DashboardPage.module.css"
import AppSidebar from "../../../layouts/MainLayout/AppSidebar"
import AppHeader from "../../../layouts/MainLayout/AppHeader"

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
  const [contextProject, setContextProject] = useState(null)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: "", description: "", color: "#1976d2", status: "", startDate: "", endDate: "" })
  const [selectedProject, setSelectedProject] = useState(null)
  const [filteredTasks, setFilteredTasks] = useState([])
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [memberResults, setMemberResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    if (dashboardData?.tasks) setFilteredTasks(dashboardData.tasks)
  }, [dashboardData])

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

  const handleProjectContextMenu = (event, project) => {
    event.preventDefault()
    setContextProject(project)
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    )
  }

  const handleProjectMenuClose = () => {
    setContextMenu(null)
    setContextProject(null)
  }

  useEffect(() => { loadData() }, [])

  // Handlers for creation
  const handleAddProject = () => {
    setProjectDialogOpen(true)
  }

  const handleCloseProjectDialog = () => {
    setProjectDialogOpen(false)
    setSelectedProject(null)
    setProjectForm({ name: "", description: "", color: "#1976d2", status: "", startDate: "", endDate: "" })
  }

  const handleProjectFormChange = (e) => {
    const { name, value } = e.target
    setProjectForm(prev => ({ ...prev, [name]: value }))
  }

  const handleProjectFormSubmit = async () => {
    try {
      if (selectedProject) {
        await updateProject(selectedProject._id, projectForm)
      } else {
        await createProject({ ...projectForm, owner: user._id })
      }
      loadData()
      handleCloseProjectDialog()
    } catch (err) {
      console.error("Error saving project:", err)
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

  const handleEditProject = (project) => {
    setSelectedProject(project)
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      color: project.color || "#1976d2",
      status: project.status || "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
    })
    setProjectDialogOpen(true)
  }

  const handleOpenAddMemberDialog = () => {
    handleProjectMenuClose()
    setMemberDialogOpen(true)
    setMemberSearchQuery("")
    setMemberResults([])
    setSearchError(null)
  }

  const handleSearchUsers = async () => {
    if (!memberSearchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    try {
      const users = await searchUsers(memberSearchQuery.trim())
      setMemberResults(users)
    } catch (err) {
      console.error("Search users failed", err)
      setSearchError("Failed to fetch users")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectMember = async (user) => {
    if (!contextProject) return
    try {
      await addProjectMember(contextProject._id, user._id, "member")
      console.log("Project member added successfully")
      loadData()
      setMemberDialogOpen(false)
    } catch (err) {
      console.error("Failed to add project member", err)
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
    <>
      <AppHeader />
      <Box className={styles.dashboardContainer}>
        <Box className={styles.sidebarContainer}>
          <Button fullWidth variant="outlined" onClick={handleAddProject} sx={{ mb:2 }}>+ Add Project</Button>
          {dashboardData?.projects && <ProjectSidebar sidebarData={dashboardData} onProjectContextMenu={handleProjectContextMenu} />}
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
          {/* View group */}
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="list" aria-label="list view"><ViewList /></ToggleButton>
              <ToggleButton value="grid" aria-label="grid view"><ViewModule /></ToggleButton>
              <ToggleButton value="calendar" aria-label="calendar view"><CalendarToday /></ToggleButton>
              <ToggleButton value="timeline" aria-label="timeline view"><Timeline /></ToggleButton>
              <ToggleButton value="stats" aria-label="statistics view"><BarChart /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {dashboardData && (
            <FilterView
              tasks={dashboardData.tasks}
              projects={dashboardData.projects}
              user={user}
              onFilter={setFilteredTasks}
            />
          )}
          {filteredTasks && (
            <Box className={styles.tasksContainer}>
              {viewMode === "list"
                ? <TaskList tasks={filteredTasks} onTaskClick={handleEditTask} onTaskContextMenu={handleTaskContextMenu} />
                : viewMode === "grid"
                  ? <TaskGrid tasks={filteredTasks} onTaskClick={handleEditTask} onTaskContextMenu={handleTaskContextMenu} />
                  : <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                    <Typography variant="h6" component="h2">View mode: {viewMode}</Typography>
                  </Box>
              }
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
          open={contextMenu !== null && contextTask !== null}
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
        {/* Context menu for projects */}
        <Menu
          open={contextMenu !== null && contextProject !== null}
          onClose={handleProjectMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleOpenAddMemberDialog}>Add Member</MenuItem>
          <MenuItem onClick={() => { handleEditProject(contextProject); handleProjectMenuClose(); }}>Edit</MenuItem>
          <MenuItem onClick={() => { deleteProject(contextProject._id).then(() => { loadData(); handleProjectMenuClose(); }); }}>Delete</MenuItem>
        </Menu>
        {/* Add new project dialog */}
        <Dialog open={projectDialogOpen} onClose={handleCloseProjectDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField name="name" label="Project Name" value={projectForm.name} onChange={handleProjectFormChange} fullWidth required />
              <TextField name="description" label="Description" value={projectForm.description} onChange={handleProjectFormChange} fullWidth multiline rows={3} />
              <TextField name="color" label="Color" type="color" value={projectForm.color} onChange={handleProjectFormChange} fullWidth />
              <TextField name="status" label="Status" value={projectForm.status} onChange={handleProjectFormChange} fullWidth />
              <TextField name="startDate" label="Start Date" type="date" value={projectForm.startDate} onChange={handleProjectFormChange} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField name="endDate" label="End Date" type="date" value={projectForm.endDate} onChange={handleProjectFormChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseProjectDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleProjectFormSubmit}>{selectedProject ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </Dialog>
        {/* Add project member dialog */}
        <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add Project Member</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Search users"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                fullWidth
                onKeyPress={(e) => { if (e.key === "Enter") handleSearchUsers() }}
                InputProps={{ endAdornment: searchLoading ? <CircularProgress size={20} /> : null }}
              />
              {searchError && <Typography color="error">{searchError}</Typography>}
              {memberResults.map((usr) => (
                <MenuItem key={usr._id} onClick={() => handleSelectMember(usr)}>
                  {usr.username} ({usr.email})
                </MenuItem>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}

export default DashboardPage
