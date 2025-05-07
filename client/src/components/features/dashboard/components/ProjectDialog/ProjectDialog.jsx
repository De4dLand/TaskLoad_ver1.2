import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

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
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate: project.endDate ? project.endDate.split("T")[0] : "",
      });
    } else {
      setFormState({
        name: "", description: "", color: "#1976d2", status: "planning", startDate: "", endDate: ""
      });
    }
  }, [project, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const dataToSubmit = { ...formState };
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
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formState.startDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formState.endDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
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