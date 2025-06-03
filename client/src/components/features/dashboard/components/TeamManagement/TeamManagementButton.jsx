import React, { useState } from 'react';
import { Button, Tooltip, Badge } from '@mui/material';
import { GroupAdd as GroupAddIcon } from '@mui/icons-material';
import TeamManagementDialog from './TeamManagementDialog';

/**
 * TeamManagementButton component
 * A button that opens the TeamManagementDialog when clicked
 */
const TeamManagementButton = ({
  project,
  team,
  members,
  tasks,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onAssignTask,
  onSearchUsers,
  searchResults,
  searchLoading,
  searchError,
  currentUser,
  badgeCount = 0
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title="Quản lý thành viên">
        <Badge badgeContent={badgeCount} color="error" invisible={badgeCount === 0}>
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={handleOpenDialog}
            size="small"
          >
            Quản lý thành viên
          </Button>
        </Badge>
      </Tooltip>

      <TeamManagementDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        project={project}
        team={team}
        members={members}
        tasks={tasks}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onUpdateMemberRole={onUpdateMemberRole}
        onAssignTask={onAssignTask}
        onSearchUsers={onSearchUsers}
        searchResults={searchResults}
        searchLoading={searchLoading}
        searchError={searchError}
        currentUser={currentUser}
      />
    </>
  );
};

export default TeamManagementButton;
