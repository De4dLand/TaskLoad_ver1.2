import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, TextField } from '@mui/material';

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
            <TextField
              label="Start Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={member.startDate || ''}
              onChange={e => onMemberChange(idx, 'startDate', e.target.value)}
            />
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
