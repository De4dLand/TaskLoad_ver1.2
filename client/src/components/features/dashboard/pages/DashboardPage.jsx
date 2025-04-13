"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule } from "@mui/icons-material"
import TaskList from "../components/TaskList/TaskList"
import TaskGrid from "../components/TaskGrid/TaskGrid"
import ProjectSidebar from "../components/ProjectSidebar/ProjectSidebar"
import { fetchDashboardData } from "../services/dashboardService"
import styles from "./DashboardPage.module.css"

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("list")

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const data = await fetchDashboardData()
        setDashboardData(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
        setError("Failed to load your tasks. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView)
    }
  }

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    )
  }

  return (
    <Box className={styles.dashboardContainer}>
      <Box className={styles.sidebarContainer}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          fullWidth
          className={styles.createTaskButton}
        >
          Create New Task
        </Button>

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
        </Box>

        {error && (
          <Paper className={styles.errorPaper}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {!error && dashboardData?.tasks && (
          <>
            {viewMode === "list" ? <TaskList tasks={dashboardData.tasks} /> : <TaskGrid tasks={dashboardData.tasks} />}
          </>
        )}
      </Box>
    </Box>
  )
}

export default DashboardPage
