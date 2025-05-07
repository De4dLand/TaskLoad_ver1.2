import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormInput from '../../../common/FormInput'; // Assuming FormInput is a generic component

const TaskDialog = ({
  open,
  onClose,
  onSubmit,
  taskform, // Changed from taskForm to match the prop name
  onFormChange,
  onDateChange,
  selectedTask,
  projects = [], // default to empty array
  users = [] // default to empty array
}) => {
  const { title, description, status, priority, dueDate, project, assignedTo, tags, estimatedHours } = taskform || {};

  const handleTagsChange = (event) => {
    const { value } = event.target;
    onFormChange({ target: { name: 'tags', value: typeof value === 'string' ? value.split(',') : value } });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            name="title"
            value={title}
            onChange={onFormChange}
            fullWidth
            required
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
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={status}
              onChange={onFormChange}
              label="Status"
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              name="priority"
              value={priority}
              onChange={onFormChange}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date"
              value={dueDate ? new Date(dueDate) : null}
              onChange={onDateChange} // This should be a handler that calls onFormChange with name: 'dueDate'
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
          <FormControl fullWidth required>
            <InputLabel id="project-label">Project</InputLabel>
            <Select
              labelId="project-label"
              name="project"
              value={project}
              onChange={onFormChange}
              label="Project"
            >
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="assignedTo-label">Assigned To</InputLabel>
            <Select
              labelId="assignedTo-label"
              name="assignedTo"
              value={assignedTo || ''} // Handle null case for Select
              onChange={onFormChange}
              label="Assigned To"
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.username || `${u.firstName} ${u.lastName}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Tags (comma-separated)"
            name="tags"
            value={Array.isArray(tags) ? tags.join(',') : ''}
            onChange={(e) => onFormChange({ target: { name: 'tags', value: e.target.value } })}
            fullWidth
            helperText="Enter tags separated by commas"
          />
           <TextField
            label="Estimated Hours"
            name="estimatedHours"
            type="number"
            value={estimatedHours}
            onChange={onFormChange}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">
          {selectedTask ? 'Save Changes' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;