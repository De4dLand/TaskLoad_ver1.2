import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ProjectDialog = ({
  open,
  onClose,
  onSubmit,
  projectForm = {},
  onFormChange,
  selectedProject
}) => {
  const { name = '', description = '', color = '#1976d2', status = 'active', startDate = null, endDate = null } = projectForm;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Project Name"
            name="name"
            value={name}
            onChange={onFormChange}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            name="description"
            value={description}
            onChange={onFormChange}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Color"
            name="color"
            type="color"
            value={color}
            onChange={onFormChange}
            fullWidth
            sx={{ height: '56px', padding: '8px' }} // Adjust height for color picker
          />
          <FormControl fullWidth>
            <InputLabel id="project-status-label">Status</InputLabel>
            <Select
              labelId="project-status-label"
              name="status"
              value={status}
              onChange={onFormChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="onhold">On Hold</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) => onFormChange({ target: { name: 'startDate', value: date ? date.toISOString().split('T')[0] : '' } })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <DatePicker
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) => onFormChange({ target: { name: 'endDate', value: date ? date.toISOString().split('T')[0] : '' } })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">
          {selectedProject ? 'Save Changes' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDialog;