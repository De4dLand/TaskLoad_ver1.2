import React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FormInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  options = [],
  required = false,
  multiline = false,
  rows = 4,
  fullWidth = true,
  ...rest
}) => {
  switch (type) {
    case 'select':
      return (
        <FormControl fullWidth={fullWidth} required={required} {...rest}>
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            name={name}
            value={value}
            onChange={onChange}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    case 'textarea':
      return (
        <TextField
          label={label}
          name={name}
          value={value || ''}
          onChange={onChange}
          multiline
          rows={rows}
          required={required}
          fullWidth={fullWidth}
          {...rest}
        />
      );
    case 'date':
      return (
        <TextField
          label={label}
          name={name}
          type="date"
          value={value || ''}
          onChange={onChange}
          required={required}
          fullWidth={fullWidth}
          InputLabelProps={{ shrink: true }}
          {...rest}
        />
      );
    case 'number':
      return (
        <TextField
          label={label}
          name={name}
          type="number"
          value={value || ''}
          onChange={onChange}
          required={required}
          fullWidth={fullWidth}
          {...rest}
        />
      );
    default:
      return (
        <TextField
          label={label}
          name={name}
          value={value || ''}
          onChange={onChange}
          required={required}
          fullWidth={fullWidth}
          multiline={multiline}
          {...rest}
        />
      );
  }
};

export default FormInput;
