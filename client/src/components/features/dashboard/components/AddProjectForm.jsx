import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  InputLabel,
  Select,
  FormControl,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const PROJECT_TEMPLATES = [
  { value: 'agile', label: 'Agile' },
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'scrum', label: 'Scrum' },
];

const COLOR_OPTIONS = [
  '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#00897b', '#ffa000', '#455a64'
];

export default function AddProjectForm({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: null,
    dueDate: null,
    template: 'agile',
    color: COLOR_OPTIONS[0],
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value ? value.toDate() : null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Title is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formData = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined
      };
      onSubmit(formData);
    }
  };

  const handleColorPick = (color) => {
    setForm((prev) => ({ ...prev, color }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Project Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(date) => handleDateChange('startDate', date)}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                value={form.dueDate ? dayjs(form.dueDate) : null}
                onChange={(date) => handleDateChange('dueDate', date)}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.dueDate,
                    helperText: errors.dueDate,
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Stack>
          <FormControl fullWidth>
            <InputLabel>Project Template</InputLabel>
            <Select
              name="template"
              value={form.template}
              label="Project Template"
              onChange={handleChange}
            >
              {PROJECT_TEMPLATES.map((tpl) => (
                <MenuItem key={tpl.value} value={tpl.value}>{tpl.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <InputLabel sx={{ mb: 1 }}>Color</InputLabel>
            <Stack direction="row" spacing={1}>
              {COLOR_OPTIONS.map((color) => (
                <Box
                  key={color}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: form.color === color ? '3px solid #222' : '2px solid #ddd',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleColorPick(color)}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Create Project</Button>
      </DialogActions>
    </Dialog>
  );
}
