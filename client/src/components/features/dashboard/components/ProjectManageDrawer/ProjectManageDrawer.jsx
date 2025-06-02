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
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Stack,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Attachment as AttachmentIcon,
  Tag as TagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountCircle as AccountCircleIcon,
  Work as WorkIcon
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
  searchResults = [],
  searchLoading = false,
  members = [],
}) => {
  // Main project form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    template: 'agile',
    startDate: '',
    endDate: '',
    color: '#1976d2',
    tags: [],
    budget: {
      estimated: 0,
      actual: 0
    },
    progress: 0,
    settings: {
      allowComments: true,
      allowAttachments: true,
      notifications: true
    }
  });

  // Member management state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [memberStartDate, setMemberStartDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState(0);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [memberFormError, setMemberFormError] = useState('');
  
  // Attachment state
  const [attachments, setAttachments] = useState([]);
  
  // Custom fields state
  const [customFields, setCustomFields] = useState([]);
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });

  // Tags input state
  const [tagInput, setTagInput] = useState('');

  // Load project data when project prop changes or drawer opens
  useEffect(() => {
    if (project) {
      console.log('ProjectManageDrawer: Project data received', project);
      setProjectForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        template: project.template || 'agile',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        color: project.color || '#1976d2',
        tags: project.tags || [],
        budget: project.budget || {
          estimated: 0,
          actual: 0
        },
        progress: project.progress || 0,
        settings: project.settings || {
          allowComments: true,
          allowAttachments: true,
          notifications: true
        }
      });
      
      setCustomFields(project.customFields || []);
      setAttachments(project.attachments || []);
      
      // Reset active tab when a new project is loaded
      setActiveTab(0);
    }
  }, [project, open]);

  // Handle project form field changes
  const handleProjectFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProjectForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProjectForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle settings toggle changes
  const handleSettingsChange = (e) => {
    const { name, checked } = e.target;
    setProjectForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: checked
      }
    }));
  };

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !projectForm.tags.includes(tagInput.trim())) {
      setProjectForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setProjectForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle custom fields
  const handleAddCustomField = () => {
    if (newCustomField.name.trim() && newCustomField.value.trim()) {
      setCustomFields([...customFields, { ...newCustomField }]);
      setNewCustomField({ name: '', value: '' });
    }
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setNewCustomField(prev => ({ ...prev, [name]: value }));
  };

  // Save project changes
  const handleSaveProject = () => {
    if (!project || !project._id) {
      console.error('Cannot save project: Project data is missing');
      return;
    }
    
    const updatedProject = {
      ...projectForm,
      _id: project._id, // Ensure the project ID is included
      customFields,
      attachments
    };
    
    console.log('Saving project changes:', updatedProject);
    onUpdateProject(updatedProject);
    
    // Close the drawer after saving
    // We don't close it immediately to allow the parent component to handle any errors
    // The parent component should close the drawer if the update is successful
  };

  // Member management functions
  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchMembers(searchQuery);
    }
  };

  const handleOpenMemberDialog = (user) => {
    setSelectedUser(user);
    setMemberDialogOpen(true);
  };

  const handleCloseMemberDialog = () => {
    setSelectedUser(null);
    setSelectedRole('member');
    setSelectedPosition('');
    setMemberStartDate(dayjs());
    setMemberDialogOpen(false);
    setMemberFormError('');
  };

  const handleAddMember = () => {
    if (!selectedUser || !selectedUser._id) {
      setMemberFormError('Please select a valid user');
      return;
    }
    
    if (!selectedPosition.trim()) {
      setMemberFormError('Position is required');
      return;
    }
    
    if (!project || !project._id) {
      setMemberFormError('Project information is missing');
      return;
    }
    
    try {
      onAddMember(selectedUser, {
        role: selectedRole,
        position: selectedPosition,
        startDate: memberStartDate.format('YYYY-MM-DD'),
        projectId: project._id // Include the project ID
      });
      
      handleCloseMemberDialog();
    } catch (error) {
      console.error('Error adding member:', error);
      setMemberFormError('Failed to add member: ' + error.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Render the status chip with appropriate color
  const renderStatusChip = (status) => {
    const statusColors = {
      planning: 'info',
      active: 'success',
      on_hold: 'warning',
      completed: 'primary',
      cancelled: 'error'
    };
    
    return (
      <Chip 
        label={status.replace('_', ' ').toUpperCase()} 
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: '600px' } },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: projectForm.color || '#1976d2',
          color: 'white'
        }}>
          <Typography variant="h6">{project?.name || 'Manage Project'}</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
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
          <Tab icon={<SettingsIcon />} label="Details" />
          <Tab icon={<PeopleIcon />} label="Members" />
          <Tab icon={<AttachmentIcon />} label="Attachments" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {/* Details Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Project Details</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    name="name"
                    value={projectForm.name}
                    onChange={handleProjectFormChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={projectForm.status}
                      onChange={handleProjectFormChange}
                      label="Status"
                    >
                      <MenuItem value="planning">Planning</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="on_hold">On Hold</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      name="template"
                      value={projectForm.template}
                      onChange={handleProjectFormChange}
                      label="Template"
                    >
                      <MenuItem value="agile">Agile</MenuItem>
                      <MenuItem value="waterfall">Waterfall</MenuItem>
                      <MenuItem value="scrum">Scrum</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    name="startDate"
                    value={projectForm.startDate}
                    onChange={handleProjectFormChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    name="endDate"
                    value={projectForm.endDate}
                    onChange={handleProjectFormChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="color"
                    label="Project Color"
                    name="color"
                    value={projectForm.color}
                    onChange={handleProjectFormChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Progress (%)"
                    name="progress"
                    value={projectForm.progress}
                    onChange={handleProjectFormChange}
                    InputProps={{
                      inputProps: { min: 0, max: 100 }
                    }}
                  />
                  <LinearProgress 
                    variant="determinate" 
                    value={Number(projectForm.progress)} 
                    sx={{ mt: 1, height: 8, borderRadius: 5 }}
                  />
                </Grid>
                
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Estimated Budget"
                    name="budget.estimated"
                    value={projectForm.budget.estimated}
                    onChange={handleProjectFormChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Actual Budget"
                    name="budget.actual"
                    value={projectForm.budget.actual}
                    onChange={handleProjectFormChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid> */}
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {projectForm.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Add Tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>Custom Fields</Typography>
                  <List>
                    {customFields.map((field, index) => (
                      <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={field.name}
                          secondary={field.value}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveCustomField(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <TextField
                      label="Field Name"
                      name="name"
                      value={newCustomField.name}
                      onChange={handleCustomFieldChange}
                      size="small"
                    />
                    <TextField
                      label="Field Value"
                      name="value"
                      value={newCustomField.value}
                      onChange={handleCustomFieldChange}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddCustomField}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                onClick={handleSaveProject}
                startIcon={<SaveIcon />}
                sx={{ mt: 3 }}
              >
                Save Changes
              </Button>
            </Box>
          )}

          {/* Members Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Project Members</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<PersonAddIcon />}
                  onClick={() => setMemberDialogOpen(true)}
                >
                  Add Member
                </Button>
              </Box>
              
              {/* Current Members List */}
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <List sx={{ width: '100%' }}>
                  {members && members.length > 0 ? (
                    members.map((member) => (
                      <ListItem 
                        key={member._id || member.user?._id}
                        divider
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => onRemoveMember(member._id || member.user?._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <Avatar 
                          src={member.profileImage || member.user?.profileImage} 
                          alt={(member.name || member.user?.name || 'User').charAt(0)} 
                          sx={{ mr: 2 }} 
                        />
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{member.name || member.user?.name}</Typography>
                              <Chip 
                                label={member.role || 'Member'} 
                                size="small" 
                                color={member.role === 'admin' ? 'primary' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {member.email || member.user?.email}
                              </Typography>
                              {member.position && (
                                <Typography variant="body2" color="text.secondary">
                                  Position: {member.position}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No members found" />
                    </ListItem>
                  )}
                </List>
              </Paper>
              
              {/* Search for Members */}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Add New Members</Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Search Users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {searchLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <IconButton onClick={handleSearch}>
                            <SearchIcon />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <Paper variant="outlined" sx={{ mb: 3 }}>
                  <List>
                    {searchResults.map((user) => (
                      <ListItem
                        key={user._id}
                        button
                        onClick={() => handleOpenMemberDialog(user)}
                      >
                        <Avatar 
                          src={user.profileImage} 
                          alt={(user.name || 'User').charAt(0)}
                          sx={{ mr: 2 }}
                        />
                        <ListItemText
                          primary={user.name}
                          secondary={user.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {/* Attachments Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Project Attachments</Typography>
              
              {/* Attachment list will go here */}
              <Typography variant="body2" color="text.secondary">
                Attachment functionality will be implemented in a future update.
              </Typography>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 3 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Project Settings</Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={projectForm.settings.allowComments}
                      onChange={handleSettingsChange}
                      name="allowComments"
                    />
                  }
                  label="Allow Comments"
                />
                <Typography variant="body2" color="text.secondary">
                  Enable or disable comments on tasks in this project
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={projectForm.settings.allowAttachments}
                      onChange={handleSettingsChange}
                      name="allowAttachments"
                    />
                  }
                  label="Allow Attachments"
                />
                <Typography variant="body2" color="text.secondary">
                  Enable or disable file attachments on tasks in this project
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={projectForm.settings.notifications}
                      onChange={handleSettingsChange}
                      name="notifications"
                    />
                  }
                  label="Project Notifications"
                />
                <Typography variant="body2" color="text.secondary">
                  Enable or disable notifications for this project
                </Typography>
              </Paper>
              
              <Button
                variant="contained"
                onClick={handleSaveProject}
                startIcon={<SaveIcon />}
                sx={{ mt: 2 }}
              >
                Save Settings
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={handleCloseMemberDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Project</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={selectedUser.profileImage} 
                  alt={selectedUser.name?.charAt(0) || 'U'} 
                  sx={{ width: 56, height: 56, mr: 2 }} 
                />
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
                </Box>
              </Box>
              
              {memberFormError && (
                <Alert severity="error" sx={{ mb: 2 }}>{memberFormError}</Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
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
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Position"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    required
                    error={memberFormError !== ''}
                    helperText={memberFormError}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={memberStartDate}
                      onChange={(newDate) => setMemberStartDate(newDate)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemberDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained" 
            color="primary"
            startIcon={<PersonAddIcon />}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default ProjectManageDrawer;