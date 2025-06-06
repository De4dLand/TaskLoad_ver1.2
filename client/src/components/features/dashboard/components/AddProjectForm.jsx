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
    const newForm = { ...form, [name]: value ? value.toDate() : null };
    setForm(newForm);
    
    // Clear any existing date errors when dates are changed
    if (errors.startDate || errors.dueDate) {
      setErrors(prev => ({
        ...prev,
        startDate: name === 'startDate' ? undefined : prev.startDate,
        dueDate: name === 'dueDate' ? undefined : prev.dueDate
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Tên dự án là bắt buộc';
    
    // Validate start date
    if (!form.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    } else if (!(form.startDate instanceof Date) || isNaN(form.startDate.getTime())) {
      newErrors.startDate = 'Ngày bắt đầu không hợp lệ';
    }
    
    // Validate due date
    if (!form.dueDate) {
      newErrors.dueDate = 'Ngày kết thúc là bắt buộc';
    } else if (!(form.dueDate instanceof Date) || isNaN(form.dueDate.getTime())) {
      newErrors.dueDate = 'Ngày kết thúc không hợp lệ';
    }
    
    // Check if both dates are valid before comparing them
    if (form.startDate && form.dueDate && 
        form.startDate instanceof Date && !isNaN(form.startDate.getTime()) && 
        form.dueDate instanceof Date && !isNaN(form.dueDate.getTime())) {
      
      if (form.dueDate < form.startDate) {
        newErrors.dueDate = 'Ngày kết thúc không thể trước ngày bắt đầu';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formData = {
        ...form
      };
      
      // Safely handle date conversion for startDate
      if (form.startDate && form.startDate instanceof Date && !isNaN(form.startDate)) {
        formData.startDate = form.startDate.toISOString();
      } else if (form.startDate) {
        // Try to convert to a valid date if it's not already
        const startDate = new Date(form.startDate);
        if (!isNaN(startDate.getTime())) {
          formData.startDate = startDate.toISOString();
        } else {
          formData.startDate = undefined;
        }
      } else {
        formData.startDate = undefined;
      }
      
      // Safely handle date conversion for dueDate
      if (form.dueDate && form.dueDate instanceof Date && !isNaN(form.dueDate)) {
        formData.dueDate = form.dueDate.toISOString();
      } else if (form.dueDate) {
        // Try to convert to a valid date if it's not already
        const dueDate = new Date(form.dueDate);
        if (!isNaN(dueDate.getTime())) {
          formData.dueDate = dueDate.toISOString();
        } else {
          formData.dueDate = undefined;
        }
      } else {
        formData.dueDate = undefined;
      }
      
      onSubmit(formData);
    }
  };

  const handleColorPick = (color) => {
    setForm((prev) => ({ ...prev, color }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm Dự Án Mới</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Tên Dự Án"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
          />
          <TextField
            label="Mô tả"
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
                label="Ngày Bắt Đầu"
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
                label="Ngày Kết Thúc"
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
            <InputLabel>Template Dự Án</InputLabel>
            <Select
              name="template"
              value={form.template}
              label="Template Dự Án"
              onChange={handleChange}
            >
              {PROJECT_TEMPLATES.map((tpl) => (
                <MenuItem key={tpl.value} value={tpl.value}>{tpl.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <InputLabel sx={{ mb: 1 }}>Màu Dự Án</InputLabel>
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
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Tạo Dự Án</Button>
      </DialogActions>
    </Dialog>
  );
}
