import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  InputAdornment,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import ProjectChat from '../ProjectChat/ProjectChat';

const ProjectManageDrawer = ({
  open,
  onClose,
  project,
  onUpdateProject,
  onAddMember,
  onRemoveMember,
  onSearchMembers,
  searchResults,
  searchLoading,
  members = [],
}) => {
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
    color: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (project) {
      setProjectForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        color: project.color || '#1976d2',
      });
    }
  }, [project]);

  const handleProjectFormChange = (e) => {
    const { name, value } = e.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProject = () => {
    onUpdateProject(projectForm);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchMembers(searchQuery);
    }
  };

  const handleAddMember = (user) => {
    onAddMember(user, selectedRole);
    setSearchQuery('');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: '600px' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6">{project?.name || 'Manage Project'}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <Tab icon={<SettingsIcon />} label="Settings" />
          <Tab icon={<PeopleIcon />} label="Members" />
          <Tab icon={<ChatIcon />} label="Chat" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Settings Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Project Details</Typography>
              <TextField
                fullWidth
                label="Project Name"
                name="name"
                value={projectForm.name}
                onChange={handleProjectFormChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={projectForm.description}
                onChange={handleProjectFormChange}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  name="startDate"
                  value={projectForm.startDate}
                  onChange={handleProjectFormChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  name="endDate"
                  value={projectForm.endDate}
                  onChange={handleProjectFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Button
                variant="contained"
                onClick={handleSaveProject}
                sx={{ mt: 2 }}
              >
                Save Changes
              </Button>
            </Box>
          )}

          {/* Members Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Project Members</Typography>
              
              {/* Current Members List */}
              <List sx={{ mb: 3 }}>
                {project?.members?.map((member) => (
                  <ListItem key={member._id || member.user?._id}>
                    <Avatar src={member.profileImage || member.user?.profileImage} 
                           alt={(member.name || member.user?.name || 'User').charAt(0)} 
                           sx={{ mr: 2 }} />
                    <ListItemText
                      primary={member.name || member.user?.name}
                      secondary={member.email || member.user?.email}
                    />
                    <ListItemSecondaryAction>
                      <Chip label={member.role || 'Member'} size="small" sx={{ mr: 1 }} />
                      <IconButton
                        edge="end"
                        onClick={() => onRemoveMember(member._id || member.user?._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {/* Add Member Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Add New Member</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {searchLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            <IconButton onClick={handleSearch}>
                              <SearchIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      label="Role"
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="viewer">Viewer</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Search Results */}
                <List>
                  {searchResults?.map((user) => (
                    <ListItem key={user._id}>
                      <Avatar src={user.profileImage} alt={user.name} sx={{ mr: 2 }} />
                      <ListItemText
                        primary={user.name}
                        secondary={user.email}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddMember(user)}
                        >
                          Add
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}

          {/* Chat Tab */}
          {activeTab === 2 && (
            <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              <ProjectChat project={project} members={project?.members || members} />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default ProjectManageDrawer;