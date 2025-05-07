import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const DeadlineSnackbar = ({ open, message, onClose }) => (
  <Snackbar
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  >
    <Alert onClose={onClose} severity="warning" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

export default DeadlineSnackbar;
