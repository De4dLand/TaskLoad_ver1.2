"use client"

import { useState } from "react"
import { List, ListItem, ListItemText, Typography, Collapse, Box, Chip, Badge, Tooltip } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import FiberManualIcon from "@mui/icons-material/FiberManualRecord"
import PeopleIcon from "@mui/icons-material/People"
import { formatDate } from "../../../../../utils/formatters"
import styles from "./ProjectSidebar.module.css"

const ProjectSidebar = ({ sidebarData, onProjectContextMenu, onProjectSelect, selectedProjectId }) => {
  const { projects, tasks } = sidebarData
  const [expandedProjects, setExpandedProjects] = useState({})
  
  // Function to get due date color based on proximity to deadline
  const getDueDateColor = (dueDate) => {
    if (!dueDate) return "#aaaaaa" // Default gray for no due date
    
    const now = new Date()
    const due = new Date(dueDate)
    const daysRemaining = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 0) return "#f44336" // Overdue - red
    if (daysRemaining <= 2) return "#ff9800" // Due soon - orange
    if (daysRemaining <= 7) return "#ffeb3b" // Due this week - yellow
    return "#4caf50" // Due later - green
  }
  
  // Function to calculate task completion status for a project
  const getTaskCompletionStatus = (projectId) => {
    const projectTasks = tasks.filter(task => {
      const taskProjectId = typeof task.project === 'string' ? task.project : task.project?._id
      return taskProjectId === projectId
    })
    
    if (projectTasks.length === 0) return { completed: 0, total: 0, percentage: 0 }
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length
    return {
      completed: completedTasks,
      total: projectTasks.length,
      percentage: Math.round((completedTasks / projectTasks.length) * 100)
    }
  }
  
  // Function to get online members count
  const getOnlineMembersCount = (project) => {
    // In a real implementation, this would use socket.io data
    // to determine which members are currently online
    if (!project.members) return 0
    
    // For demonstration purposes, we're using a placeholder
    // In a real app, you would get this data from socket.io
    // You would implement this using the socket.io connection to track online users
    // and filter them against the project members
    return Math.min(Math.floor(Math.random() * (project.members.length + 1)), project.members.length)
  }

  if (!projects || projects.length === 0) {
    return (
      <Box className={styles.emptyProjects}>
        <Typography variant="body2" color="textSecondary">
          No projects found
        </Typography>
      </Box>
    )
  }

  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }))
  }
  
  const handleProjectClick = (e, project) => {
    // Toggle expansion
    toggleProject(project._id)
    
    // Notify parent component about project selection
    if (onProjectSelect) {
      onProjectSelect(project)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiberManualIcon className={styles.completedIcon} />
      case "in_progress":
        return <FiberManualIcon className={styles.inProgressIcon} />
      case "todo":
      default:
        return <FiberManualIcon className={styles.todoIcon} />
    }
  }
  
  // Format status text for display
  const formatStatusText = (status) => {
    if (!status) return ''
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)
  }

  return (
    <List component="nav" className={styles.projectList}>
      {projects.map((project) => (
        <Box key={project._id}>
          <ListItem
            onClick={(e) => handleProjectClick(e, project)}
            onContextMenu={(e) => { e.preventDefault(); onProjectContextMenu && onProjectContextMenu(e, project); }}
            className={`${styles.projectItem} ${selectedProjectId === project._id ? styles.selectedProject : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <Box className={styles.projectHeader}>
              <Typography variant="subtitle1" className={styles.projectTitle}>
                {project.name}
              </Typography>
              
              {/* Due date with color indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    backgroundColor: getDueDateColor(project.dueDate),
                    display: 'inline-block',
                    mr: 0.5
                  }} 
                />
                <Typography variant="caption" color="textSecondary" className={styles.projectDueDate}>
                  Due: {formatDate(project.dueDate)}
                </Typography>
              </Box>
              
              {/* Task completion status and online members */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                {/* Only show task completion in expanded state */}
                {expandedProjects[project._id] && (
                  <Tooltip title="Tasks completed">
                    <Chip 
                      size="small" 
                      label={`${getTaskCompletionStatus(project._id).completed}/${getTaskCompletionStatus(project._id).total} tasks`}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                )}
                
                {/* Always show online members count */}
                <Tooltip title="Members online">
                  <Badge 
                    badgeContent={getOnlineMembersCount(project)} 
                    color="success" 
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                  >
                    <PeopleIcon fontSize="small" />
                  </Badge>
                </Tooltip>
              </Box>
            </Box>
            {expandedProjects[project._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>

          <Collapse in={expandedProjects[project._id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {tasks
              .filter((task) => {
                const projectId = typeof task.project === 'string' ? task.project : task.project?._id
                return projectId === project._id
              })
              .map((task) => (
                <ListItem key={task._id} className={styles.taskItem}>
                  <Box className={styles.taskStatusIcon}>{getStatusIcon(task.status)}</Box>
                  <ListItemText 
                    primary={task.title} 
                    primaryTypographyProps={{ className: styles.taskTitle }} 
                    secondary={
                      <Typography variant="caption" className={styles.taskStatus}>
                        {formatStatusText(task.status)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {tasks.filter((task) => {
                const projectId = typeof task.project === 'string' ? task.project : task.project?._id
                return projectId === project._id
              }).length === 0 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="textSecondary">No tasks</Typography>
                </Box>
              )}
            </List>
          </Collapse>
        </Box>
      ))}
    </List>
  )
}

export default ProjectSidebar
