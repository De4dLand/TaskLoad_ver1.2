import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const MemberDialog = ({ open, onClose, members, onMemberChange, onRemoveMember, onSave, selectedMembers }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Manage Members</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {members.map((member, idx) => (
          <Box key={idx} display="flex" alignItems="center" gap={2}>
            <TextField
              label="Name"
              value={member.name || ''}
              onChange={e => onMemberChange(idx, 'name', e.target.value)}
              size="small"
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={member.startDate ? dayjs(member.startDate) : null}
                onChange={(date) => onMemberChange(idx, 'startDate', date ? date.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
            <Button color="error" size="small" onClick={() => onRemoveMember(idx)}>Remove</Button>
          </Box>
        ))}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" color="primary" onClick={onSave} disabled={selectedMembers.length === 0}>Save</Button>
    </DialogActions>
  </Dialog>
);

export default MemberDialog;
