import { Box, Typography, Avatar, AvatarGroup, Tooltip, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const ProjectMemberInfo = ({ user, projectMembers = [] }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* User Role */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">
          Role: <Chip size="small" label={user?.role || 'Member'} />
        </Typography>
      </Box>

      {/* Project Members */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Team Members:
        </Typography>
        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
          {projectMembers.map((member) => (
            <Tooltip key={member._id} title={`${member.username} (${member.role || 'Member'})`}>
              <Avatar
                alt={member.username}
                src={member.profileImage}
                sx={{ width: 24, height: 24 }}
              >
                {member.username?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      </Box>
    </Box>
  );
};

export default ProjectMemberInfo;