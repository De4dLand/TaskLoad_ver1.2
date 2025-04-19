"use client"

import { useState } from "react"
import { List, ListItem, ListItemText, Typography, Collapse, Box } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import FiberManualIcon from "@mui/icons-material/FiberManualRecord"
import { formatDate } from "../../../../../utils/formatters"
import styles from "./ProjectSidebar.module.css"

const ProjectSidebar = ({ sidebarData }) => {
  const { projects, tasks } = sidebarData
  const [expandedProjects, setExpandedProjects] = useState({})

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiberManualIcon className={styles.completedIcon} />
      case "in_progress":
        return <FiberManualIcon className={styles.inProgressIcon} />
      default:
        return <FiberManualIcon className={styles.todoIcon} />
    }
  }

  return (
    <List component="nav" className={styles.projectList}>
      {projects.map((project) => (
        <Box key={project._id}>
          <ListItem onClick={() => toggleProject(project._id)} className={styles.projectItem}>
            <Box className={styles.projectHeader}>
              <Typography variant="subtitle1" className={styles.projectTitle}>
                {project.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" className={styles.projectDueDate}>
                Due: {formatDate(project.dueDate)}
              </Typography>
            </Box>
            {expandedProjects[project._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>

          <Collapse in={expandedProjects[project._id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {tasks
              .filter((task) => task.project._id === project._id)
              .map((task) => (
                <ListItem key={task._id} className={styles.taskItem}>
                  <Box className={styles.taskStatusIcon}>{getStatusIcon(task.status)}</Box>
                  <ListItemText primary={task.title} primaryTypographyProps={{ className: styles.taskTitle }} />
                </ListItem>
              ))}
              {tasks.filter((task) => task.project._id === project._id).length === 0 && (
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
