"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule } from "@mui/icons-material"
import TaskList from "../components/TaskList/TaskList"
import TaskGrid from "../components/TaskGrid/TaskGrid"
import ProjectSidebar from "../components/ProjectSidebar/ProjectSidebar"
import DataNotFound from "../../../common/DataNotFound"
import { fetchDashboardData, createProject, createTask } from "../services/dashboardService"
import styles from "./DashboardPage.module.css"

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("list")

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
    if (name) await createProject({ name }) && loadData()
  }
  const handleAddTask = async () => {
    const title = prompt("Enter new task title:")
    if (!title || !dashboardData?.projects?.[0]) return
    const projectId = dashboardData.projects[0]._id
    await createTask({ title, projectId })
    loadData()
  }

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView)
    }
  }

  if (loading) return (<Box className={styles.loadingContainer}><CircularProgress /></Box>)

  if (error) {
    return <DataNotFound message={error} />
  }

  if (dashboardData && dashboardData.projects.length === 0) {
    return <DataNotFound message="No projects found" />
  }

  return (
    <Box className={styles.dashboardContainer}>
      <Box className={styles.sidebarContainer}>
        <Button fullWidth variant="outlined" onClick={handleAddProject} sx={{ mb:2 }}>+ Add Project</Button>
        {dashboardData?.projects && <ProjectSidebar projects={dashboardData.projects} />}
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
          <>
            {viewMode === "list" ? <TaskList tasks={dashboardData.tasks} /> : <TaskGrid tasks={dashboardData.tasks} />}
          </>
        )}
      </Box>
    </Box>
  )
}

export default DashboardPage
