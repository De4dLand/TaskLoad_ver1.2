"use client"

import { useState, useEffect } from "react"
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, Grid, Box, FormHelperText } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import styles from "./TaskForm.module.css"

const TaskForm = ({ initialValues = {}, onSubmit, loading = false }) => {
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : null,
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
      ...initialValues,
    })
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
      dueDate: date ? new Date(date) : null,
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

    if (!formValues.dueDate) {
      newErrors.dueDate = "Due date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Convert dueDate to ISO string if present
      const submitValues = {
        ...formValues,
        dueDate: formValues.dueDate ? formValues.dueDate.toISOString() : null,
      }
      onSubmit(submitValues)
    }
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
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
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
          <DatePicker
            label="Due Date"
            value={formValues.dueDate}
            onChange={handleDateChange}
            renderInput={(params) => (
              <TextField {...params} fullWidth error={!!errors.dueDate} helperText={errors.dueDate} required />
            )}
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
