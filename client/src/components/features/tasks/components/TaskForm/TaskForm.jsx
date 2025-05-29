"use client"

import { useState, useEffect } from "react"
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, Grid, Box, FormHelperText, Chip, OutlinedInput } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import styles from "./TaskForm.module.css"
import { useProjects } from "../../../../../hooks/useProjects"
import { useTeamMembers } from "../../../../../hooks/useTeamMembers"

const TaskForm = ({ initialValues = {}, onSubmit, loading = false }) => {
  const { projects, loading: projectsLoading } = useProjects()
  const [selectedProject, setSelectedProject] = useState(initialValues.project || "")
  const { members, loading: membersLoading } = useTeamMembers(selectedProject)

  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : null,
    project: "",
    assignedTo: "",
    tags: [],
    estimatedHours: "",
    ...initialValues,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormValues({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : null,
      project: "",
      assignedTo: "",
      tags: [],
      estimatedHours: "",
      ...initialValues,
    })
    
    if (initialValues.project) {
      setSelectedProject(initialValues.project)
    }
  }, [initialValues])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues({
      ...formValues,
      [name]: value,
    })

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const handleDateChange = (date) => {
    setFormValues({
      ...formValues,
      dueDate: date ? date.toDate() : null,
    })

    if (errors.dueDate) {
      setErrors({
        ...errors,
        dueDate: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formValues.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formValues.project) {
      newErrors.project = "Project is required"
    }

    if (!formValues.dueDate) {
      newErrors.dueDate = "Due date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Format data to match backend expectations
      const submitValues = {
        title: formValues.title,
        description: formValues.description,
        status: formValues.status,
        priority: formValues.priority,
        dueDate: formValues.dueDate ? formValues.dueDate.toISOString() : null,
        project: formValues.project,
        assignedTo: formValues.assignedTo || "",
        tags: formValues.tags || [],
        estimatedHours: formValues.estimatedHours ? Number(formValues.estimatedHours) : undefined
      }
      onSubmit(submitValues)
    }
  }
  
  const handleProjectChange = (e) => {
    const projectId = e.target.value
    setSelectedProject(projectId)
    setFormValues({
      ...formValues,
      project: projectId,
      // Reset assignedTo when project changes
      assignedTo: ""
    })
  }
  
  const handleTagChange = (e) => {
    const tagInput = e.target.value
    const tagArray = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    
    setFormValues({
      ...formValues,
      tags: tagArray
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="title"
            label="Title"
            fullWidth
            value={formValues.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formValues.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formValues.status} onChange={handleChange} label="Status">
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="reviewing">Reviewing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.priority}>
            <InputLabel>Priority</InputLabel>
            <Select name="priority" value={formValues.priority} onChange={handleChange} label="Priority">
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
            {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Due Date"
              value={formValues.dueDate ? dayjs(formValues.dueDate) : null}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.dueDate,
                  helperText: errors.dueDate,
                  required: true
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.project}>
            <InputLabel>Project *</InputLabel>
            <Select
              name="project"
              value={formValues.project}
              onChange={handleProjectChange}
              label="Project *"
              required
            >
              {projectsLoading ? (
                <MenuItem disabled>Loading projects...</MenuItem>
              ) : (
                projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select
              name="assignedTo"
              value={formValues.assignedTo}
              onChange={handleChange}
              label="Assign To"
              disabled={!formValues.project || membersLoading}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {!membersLoading && members.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.firstName ? `${member.firstName} ${member.lastName}` : member.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="estimatedHours"
            label="Estimated Hours"
            type="number"
            fullWidth
            value={formValues.estimatedHours}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.5 }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="tags"
            label="Tags (comma separated)"
            fullWidth
            value={formValues.tags.join(', ')}
            onChange={handleTagChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Box className={styles.buttonContainer}>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? "Saving..." : "Save Task"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}

export default TaskForm
