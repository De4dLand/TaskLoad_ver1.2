import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const ProjectDialog = ({ open, onClose, onSubmit, project, user }) => {
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    color: "#1976d2",
    status: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    if (project) {
      setFormState({
        name: project.name || "",
        description: project.description || "",
        color: project.color || "#1976d2",
        status: project.status || "",
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
      });
    } else {
      setFormState({
        name: "", description: "", color: "#1976d2", status: "planning", startDate: null, endDate: null
      });
    }
  }, [project, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, newDate) => {
    setFormState(prev => ({ ...prev, [name]: newDate ? newDate.toDate() : null }));
  };

  const handleSubmit = () => {
    const dataToSubmit = { 
      ...formState
    };
    
    // Safely handle date conversions
    if (formState.startDate && formState.startDate instanceof Date && !isNaN(formState.startDate)) {
      dataToSubmit.startDate = formState.startDate.toISOString();
    } else if (formState.startDate) {
      // Try to convert to a valid date if it's not already
      const startDate = new Date(formState.startDate);
      if (!isNaN(startDate.getTime())) {
        dataToSubmit.startDate = startDate.toISOString();
      } else {
        dataToSubmit.startDate = undefined;
      }
    } else {
      dataToSubmit.startDate = undefined;
    }
    
    // Same safe handling for endDate
    if (formState.endDate && formState.endDate instanceof Date && !isNaN(formState.endDate)) {
      dataToSubmit.endDate = formState.endDate.toISOString();
    } else if (formState.endDate) {
      // Try to convert to a valid date if it's not already
      const endDate = new Date(formState.endDate);
      if (!isNaN(endDate.getTime())) {
        dataToSubmit.endDate = endDate.toISOString();
      } else {
        dataToSubmit.endDate = undefined;
      }
    } else {
      dataToSubmit.endDate = undefined;
    }
    
    if (!project && user?._id) { // Only add owner if it's a new project
        dataToSubmit.owner = user._id;
    }
    onSubmit(dataToSubmit, !!project); // Pass a flag indicating if it's an edit
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Project Name" name="name" value={formState.name} onChange={handleChange} fullWidth required />
          <TextField label="Description" name="description" value={formState.description} onChange={handleChange} multiline rows={3} fullWidth />
          <TextField label="Color" name="color" type="color" value={formState.color} onChange={handleChange} fullWidth sx={{ height: '56px', padding: '8px' }} />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formState.status} onChange={handleChange} label="Status">
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="onhold">On Hold</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={formState.startDate ? dayjs(formState.startDate) : null}
              onChange={(newDate) => handleDateChange('startDate', newDate)}
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
              label="End Date"
              value={formState.endDate ? dayjs(formState.endDate) : null}
              onChange={(newDate) => handleDateChange('endDate', newDate)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  required: false
                } 
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {project ? "Save Changes" : "Create Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDialog;