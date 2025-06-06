"use client"

import { useState } from "react"
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Box, 
  Chip, 
  Badge, 
  Tooltip,
  useTheme,
  useMediaQuery
} from "@mui/material"
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
    if (!project.members || project.members.length === 0) return 0
    // In a real implementation, this would use socket.io data
    // For now, we'll show the total number of members
    return project.members.length
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

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Default color if not specified
  const getProjectColor = (project) => {
    return project.color || '#1976d2' // Default to primary color if no color is set
  }

  return (
    <Box className={styles.sidebarContainer}>
      <div className={styles.scrollContainer}>
        <List component="nav" className={styles.projectList}>
          <div className={styles.scrollContent}>
        {projects.map((project) => (
          <Box key={project._id} className={styles.projectWrapper}>
            <ListItem
              onClick={(e) => onProjectSelect && onProjectSelect(project)}
              onContextMenu={(e) => { 
                e.preventDefault(); 
                onProjectContextMenu && onProjectContextMenu(e, project); 
              }}
              className={`${styles.projectItem} ${selectedProjectId === project._id ? styles.selectedProject : ''}`}
              style={{ 
                cursor: 'pointer',
                borderLeft: `4px solid ${getProjectColor(project)}`
              }}
            >
              <Box className={styles.projectContent}>
                <Typography variant="subtitle1" className={styles.projectTitle}>
                  {project.name}
                </Typography>
                
                <Box className={styles.projectMeta}>
                  {/* Due date */}
                  <Box className={styles.dueDate}>
                    <Box 
                      className={styles.dueDateDot}
                      style={{ backgroundColor: getDueDateColor(project.dueDate) }}
                    />
                    <Typography variant="caption" className={styles.projectDueDate}>
                      {project.dueDate ? `Due: ${formatDate(project.dueDate)}` : 'No due date'}
                    </Typography>
                  </Box>
                  
                  {/* Task completion and members */}
                  <Box className={styles.projectStats}>
                    <Tooltip title="Tasks completed">
                      <Chip 
                        size="small" 
                        label={`${getTaskCompletionStatus(project._id).completed}/${getTaskCompletionStatus(project._id).total}`}
                        className={styles.taskChip}
                      />
                    </Tooltip>
                    
                    <Tooltip title="Members online">
                      <Badge 
                        badgeContent={getOnlineMembersCount(project)} 
                        color="success" 
                        className={styles.membersBadge}
                      >
                        <PeopleIcon fontSize="small" />
                      </Badge>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </ListItem>
          </Box>
        ))}
          </div>
        </List>
      </div>
    </Box>
  )
}

export default ProjectSidebar
