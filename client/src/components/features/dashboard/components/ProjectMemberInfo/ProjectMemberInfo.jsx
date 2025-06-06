import { Box, Typography, Avatar, AvatarGroup, Tooltip, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
const ProjectMemberInfo = ({ user, projectMembers = [] }) => {
  const [role, setRole] = useState('');
  useEffect(() => {
    const member = projectMembers.find((member) => member.user._id === user._id);
    setRole(member?.role || 'Member');
  }, [projectMembers, user]);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* User Role */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">
          Vai trò: <Chip size="small" label={role} />
        </Typography>
      </Box>

      {/* Project Members */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Thành viên đội nhóm:
        </Typography>
        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
          {projectMembers.map((member) => (
            <Tooltip key={member._id} title={`${member.user.username} (${member.role || 'Member'})`}>
              <Avatar
                alt={member.user.username}
                src={member.user.profileImage}
                sx={{ width: 24, height: 24 }}
              >
                {member.user.username?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      </Box>
    </Box>
  );
};

export default ProjectMemberInfo;