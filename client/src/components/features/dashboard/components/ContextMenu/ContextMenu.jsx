import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import AssignmentIcon from '@mui/icons-material/Assignment'; // For assign task / view tasks
import GroupAddIcon from '@mui/icons-material/GroupAdd'; // For manage members

const ContextMenu = ({
  anchorEl,
  open,
  onClose,
  menuType, // 'project' or 'task'
  item, // The project or task object
  onEdit,
  onDelete,
  onViewDetails,
  onArchive, // Specific to project
  onUnarchive, // Specific to project
  onAssign, // Specific to task
  onManageMembers, // Specific to project
  // Add other specific handlers as needed
}) => {
  const handleClose = () => {
    onClose();
  };

  const projectMenuItems = [
    { label: 'View Details', icon: <VisibilityIcon fontSize="small" />, action: () => onViewDetails(item), id: 'view-project-details' },
    { label: 'Edit Project', icon: <EditIcon fontSize="small" />, action: () => onEdit(item), id: 'edit-project' },
    { label: 'Manage Members', icon: <GroupAddIcon fontSize="small" />, action: () => onManageMembers(item), id: 'manage-project-members' },
    item?.status !== 'archived' && { label: 'Archive Project', icon: <ArchiveIcon fontSize="small" />, action: () => onArchive(item), id: 'archive-project' },
    item?.status === 'archived' && { label: 'Unarchive Project', icon: <UnarchiveIcon fontSize="small" />, action: () => onUnarchive(item), id: 'unarchive-project' },
    { label: 'Delete Project', icon: <DeleteIcon fontSize="small" />, action: () => onDelete(item), id: 'delete-project', color: 'error.main' },
  ].filter(Boolean); // Filter out falsy values (e.g. conditional archive/unarchive)

  const taskMenuItems = [
    { label: 'View Details', icon: <VisibilityIcon fontSize="small" />, action: () => onViewDetails(item), id: 'view-task-details' },
    { label: 'Edit Task', icon: <EditIcon fontSize="small" />, action: () => onEdit(item), id: 'edit-task' },
    { label: 'Assign/Reassign', icon: <AssignmentIcon fontSize="small" />, action: () => onAssign(item), id: 'assign-task' },
    // Add more task-specific actions here, e.g., change status, set priority
    { label: 'Delete Task', icon: <DeleteIcon fontSize="small" />, action: () => onDelete(item), id: 'delete-task', color: 'error.main' },
  ];

  const itemsToRender = menuType === 'project' ? projectMenuItems : taskMenuItems;

  if (!item) return null; // Don't render if no item is provided

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      PaperProps={{
        elevation: 3,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {itemsToRender.map((menuItem) => (
        menuItem && (
          <MenuItem
            key={menuItem.id}
            onClick={() => {
              menuItem.action();
              handleClose();
            }}
            sx={menuItem.color ? { color: menuItem.color } : {}}
          >
            {menuItem.icon && <ListItemIcon>{menuItem.icon}</ListItemIcon>}
            <ListItemText primary={menuItem.label} />
          </MenuItem>
        )
      ))}
    </Menu>
  );
};

export default ContextMenu;