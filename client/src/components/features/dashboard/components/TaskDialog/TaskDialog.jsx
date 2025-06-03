import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Chip, Box, FormHelperText } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TaskDialog = ({ open, onClose, onSubmit, task, projects = [], users = [] }) => {
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    startDate: null,
    dueDate: null,
    project: "",
    assignedTo: null,
    tags: [],
    estimatedHours: ""
  });

  useEffect(() => {
    if (task) {
      setFormState({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        startDate: task.startDate ? new Date(task.startDate) : null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        project: task.project?._id || task.project || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "", // Ensure it's an empty string for Select if null/undefined
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || ""
      });
    } else {
      setFormState({
        title: "", description: "", status: "todo", priority: "medium",
        startDate: null, dueDate: null, project: "", assignedTo: "", tags: [], estimatedHours: ""
      });
    }
  }, [task, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e) => {
    const { value } = e.target;
    setFormState(prev => ({ ...prev, tags: value.split(",").map(tag => tag.trim()).filter(tag => tag) }));
  };

  const handleDateChange = (newDate) => {
    setFormState(prev => ({ ...prev, dueDate: newDate ? newDate.toDate() : null }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formState.title || !formState.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!formState.project) {
      alert('Project is required');
      return;
    }
    
    // Create a clean copy of the form state to submit
    const dataToSubmit = {
      ...formState,
      title: formState.title.trim(), // Ensure title is trimmed
      assignedTo: formState.assignedTo || null, // Send null if empty string
      project: formState.project, // Project is required and must be a valid ID
      estimatedHours: formState.estimatedHours ? Number(formState.estimatedHours) : undefined // Convert to number if present
    };
    
    // Safely handle date conversion for dueDate
    if (formState.dueDate && formState.dueDate instanceof Date && !isNaN(formState.dueDate)) {
      dataToSubmit.dueDate = formState.dueDate.toISOString();
    } else if (formState.dueDate) {
      // Try to convert to a valid date if it's not already
      const dueDate = new Date(formState.dueDate);
      if (!isNaN(dueDate.getTime())) {
        dataToSubmit.dueDate = dueDate.toISOString();
      } else {
        dataToSubmit.dueDate = undefined;
      }
    } else {
      dataToSubmit.dueDate = undefined;
    }

    // Ensure tags are properly formatted as an array of strings
    if (Array.isArray(formState.tags)) {
      dataToSubmit.tags = formState.tags.filter(tag => tag.trim() !== '');
    }
    
    console.log('Submitting task data:', dataToSubmit);
    onSubmit(dataToSubmit, !!task); // Pass a flag indicating if it's an edit
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" name="title" value={formState.title} onChange={handleChange} fullWidth required />
          <TextField label="Description" name="description" value={formState.description} onChange={handleChange} multiline rows={3} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formState.status} onChange={handleChange} label="Status">
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select name="priority" value={formState.priority} onChange={handleChange} label="Priority">
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={formState.startDate ? dayjs(formState.startDate) : null}
              onChange={handleDateChange}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  required: false
                } 
              }}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Due Date"
              value={formState.dueDate ? dayjs(formState.dueDate) : null}
              onChange={handleDateChange}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  required: false
                } 
              }}
            />
          </LocalizationProvider>
          <FormControl fullWidth required error={!formState.project}>
            <InputLabel>Project</InputLabel>
            <Select name="project" value={formState.project} onChange={handleChange} label="Project" required>
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </Select>
            {!formState.project && <FormHelperText>Project is required</FormHelperText>}
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Assigned To</InputLabel>
            <Select name="assignedTo" value={formState.assignedTo || ""} onChange={handleChange} label="Assigned To">
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>{u.username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u._id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Tags (comma-separated)"
            name="tags"
            value={formState.tags.join(", ")}
            onChange={handleTagChange}
            fullWidth
            helperText="Enter tags separated by commas"
          />
          {formState.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {formState.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" onDelete={() => setFormState(prev => ({...prev, tags: prev.tags.filter(t => t !== tag)}))} />
              ))}
            </Box>
          )}
          <TextField label="Estimated Hours" name="estimatedHours" type="number" value={formState.estimatedHours} onChange={handleChange} fullWidth inputProps={{ min: 0 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {task ? "Save Changes" : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;