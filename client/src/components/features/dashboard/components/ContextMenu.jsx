import React from 'react';
import { Menu, MenuItem } from '@mui/material';

const ContextMenu = ({
  contextMenu,
  onClose,
  onEdit,
  onDelete,
  onAddMember, // Specific to project context menu
  itemType // 'task' or 'project'
}) => {
  if (!contextMenu) {
    return null;
  }

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem onClick={() => { onEdit(); onClose(); }}>Edit</MenuItem>
      <MenuItem onClick={() => { onDelete(); onClose(); }}>Delete</MenuItem>
      {itemType === 'project' && onAddMember && (
        <MenuItem onClick={() => { onAddMember(); onClose(); }}>Add Members</MenuItem>
      )}
      {/* Add other specific actions based on itemType if needed */}
    </Menu>
  );
};

export default ContextMenu;