"use client"

import { useState } from "react"
import { List, ListItem, ListItemText, Typography, Collapse, Box } from "@mui/material"
//, FiberManual 
import { ExpandMore, ExpandLess as FiberManualIcon } from "@mui/icons-material"
import { formatDate } from "../../../../../utils/formatters"
import styles from "./ProjectSidebar.module.css"

const ProjectSidebar = ({ projects }) => {
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
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
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
          <ListItem button onClick={() => toggleProject(project._id)} className={styles.projectItem}>
            <Box className={styles.projectHeader}>
              <Typography variant="subtitle1" className={styles.projectTitle}>
                {project.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" className={styles.projectDueDate}>
                Due: {formatDate(project.dueDate)}
              </Typography>
            </Box>
            {expandedProjects[project._id] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={expandedProjects[project._id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {project.tasks &&
                project.tasks.map((task) => (
                  <ListItem key={task._id} button className={styles.taskItem}>
                    <Box className={styles.taskStatusIcon}>{getStatusIcon(task.status)}</Box>
                    <ListItemText primary={task.title} primaryTypographyProps={{ className: styles.taskTitle }} />
                  </ListItem>
                ))}
            </List>
          </Collapse>
        </Box>
      ))}
    </List>
  )
}

export default ProjectSidebar
