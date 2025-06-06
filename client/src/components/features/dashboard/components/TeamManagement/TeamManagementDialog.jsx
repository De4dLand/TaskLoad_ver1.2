import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Paper,
  Grid,
  Tooltip,
  Alert
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AssignmentInd as AssignmentIndIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import styles from './TeamManagement.module.css';

/**
 * TeamManagementDialog component
 * A comprehensive dialog for managing team members, assigning tasks, and viewing team information
 */
const TeamManagementDialog = ({
  open,
  onClose,
  project,
  team,
  members = [],
  tasks = [],
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onAssignTask,
  onSearchUsers,
  searchResults = [],
  searchLoading = false,
  searchError = null,
  currentUser
}) => {
  // Check if current user is the project owner
  const isProjectOwner = project?.owner?._id === currentUser?._id || 
                        project?.owner === currentUser?._id;
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Member management state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [addMemberError, setAddMemberError] = useState(null);
  
  // Task assignment state
  const [taskAssignments, setTaskAssignments] = useState({});
  const [taskAssignmentError, setTaskAssignmentError] = useState(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRole('member');
      setAddMemberError(null);
      setTaskAssignments({});
      setTaskAssignmentError(null);
      setActiveTab(0);
    }
  }, [open]);
  
  // Handle search for users
  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchUsers(searchQuery);
    }
  };
  
  // Handle adding a member
  const handleAddMember = async () => {
    if (!selectedUser) {
      setAddMemberError('Vui lòng chọn người dùng để thêm');
      return;
    }
    
    try {
      await onAddMember(selectedUser._id, selectedRole);
      setSelectedUser(null);
      setSearchQuery('');
      setAddMemberError(null);
    } catch (error) {
      setAddMemberError(error.message || 'Failed to add member');
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async (userId) => {
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
      // Optionally show error message
    }
  };
  
  // Handle updating a member's role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await onUpdateMemberRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
      // Optionally show error message
    }
  };
  
  // Handle task assignment
  const handleAssignTask = async (taskId, userId) => {
    try {
      await onAssignTask(taskId, userId);
      
      // Update local state
      setTaskAssignments({
        ...taskAssignments,
        [taskId]: userId
      });
      
      setTaskAssignmentError(null);
    } catch (error) {
      setTaskAssignmentError(error.message || 'Failed to assign task');
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={styles.teamManagementDialog}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Typography variant="h6">Quản lý thành viên</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        aria-label="team management tabs"
      >
        <Tab icon={<PersonAddIcon />} label="Thành viên" />
        <Tab icon={<AssignmentIndIcon />} label="Giao việc" />
        <Tab icon={<InfoIcon />} label="Thống kê dự án" />
      </Tabs>
      
      <DialogContent className={styles.dialogContent}>
        {/* Members Tab */}
        {activeTab === 0 && (
          <Box className={styles.tabContent}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Thành viên dự án
              </Typography>
              {!isProjectOwner && (
                <Chip 
                  label="Chế độ xem" 
                  size="small" 
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
            
            {/* Add Member Section - Only for Project Owners */}
          

            {/* Members List */}
            <Paper elevation={0} className={styles.membersListSection}>
              <Typography variant="subtitle1" gutterBottom>
                Thành viên hiện tại
              </Typography>
              
              {members.length === 0 ? (
                <Alert severity="info">
                  Không có thành viên nào trong dự án này. Thêm thành viên bằng cách sử dụng form trên.
                </Alert>
              ) : (
                <List>
                  {members.map((member) => (
                    <ListItem
                      key={member._id}  
                      secondaryAction={
                        member._id !== currentUser?._id && (
                          <Box display="flex" gap={1}>  

                            <Box display="flex" gap={1}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={member.role || 'member'}
                                  onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                                  size="small"
                                  displayEmpty
                                  disabled={!isProjectOwner}
                                >
                                  <MenuItem value="member">Member</MenuItem>
                                  <MenuItem value="owner">Owner</MenuItem>
                                </Select>
                              </FormControl>
                              {isProjectOwner && (
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete" 
                                  onClick={() => handleRemoveMember(member._id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {member.username?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.user.username}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {member.user.email}
                            </Typography>
                            <Chip
                              label={member._id === currentUser?._id ? 'You' : member.role || 'Member'}
                              size="small"
                              color={member._id === currentUser?._id ? 'primary' : 'default'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        )}
        
        {/* Task Assignment Tab */}
        {activeTab === 1 && (
          <Box className={styles.tabContent}>
            <Typography variant="h6" gutterBottom>
              Giao việc
            </Typography>
            
            {tasks.length === 0 ? (
              <Alert severity="info">
                Không có công việc nào để giao. Hãy tạo công việc trước.
              </Alert>
            ) : (
              <Paper elevation={0} className={styles.taskAssignmentSection}>
                <List>
                  {tasks.map((task) => (
                    <ListItem
                      key={task._id}
                      divider
                      secondaryAction={
                        <FormControl sx={{ minWidth: 200 }}>
                          <InputLabel value={task.assignedTo?.username || ''}>{task.assignedTo?.username || 'Assign To'}</InputLabel>
                          <Select
                            labelId={`assign-task-${task._id}-label`}
                            value={taskAssignments[task._id] || task.assignedTo?.user?._id || ''}
                            onChange={(e) => handleAssignTask(task._id, e.target.value)}
                            disabled={!isProjectOwner}
                          >
                            <MenuItem value="">
                              <em>Không giao</em>
                            </MenuItem>
                            {members.map((member) => (
                              <MenuItem key={member.user._id} value={member.user._id} >
                                {member.user.username} {member.user._id === currentUser?._id && '(You)'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500}>
                            {task.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              Status: {task.status}
                            </Typography>
                            <Chip
                              label={task.priority}
                              size="small"
                              color={
                                task.priority === 'high' 
                                  ? 'error' 
                                  : task.priority === 'medium' 
                                    ? 'warning' 
                                    : 'success'
                              }
                              sx={{ ml: 1 }}
                            />
                            {task.dueDate && (
                              <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                
                {taskAssignmentError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {taskAssignmentError}
                  </Alert>
                )}
              </Paper>
            )}
          </Box>
        )}
        
        {/* Team Info Tab */}
        {activeTab === 2 && (
          <Box className={styles.tabContent}>
            <Typography variant="h6" gutterBottom>
              Thông tin nhóm
            </Typography>
            
            <Paper elevation={0} className={styles.teamInfoSection}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Thông tin dự án
                  </Typography>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Tên dự án
                    </Typography>
                    <Typography variant="body1">
                      {project?.name || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Mô tả
                    </Typography>
                    <Typography variant="body1">
                      {project?.description || 'Không có mô tả'}
                    </Typography>
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Chip 
                      label={project?.status || 'Active'} 
                      color={project?.status === 'completed' ? 'success' : 'primary'}
                    />
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Thời gian
                    </Typography>
                    <Typography variant="body1">
                      {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} 
                      {' - '}
                      {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'Đang tiến hành'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Thông tin thống kê
                  </Typography>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng thành viên
                    </Typography>
                    <Typography variant="body1">
                      {members.length}
                    </Typography>
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng công việc
                    </Typography>
                    <Typography variant="body1">
                      {tasks.length}
                    </Typography>
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Hoàn thành
                    </Typography>
                    <Typography variant="body1">
                      {tasks.filter(task => task.status === 'completed').length} 
                      {' '}
                      ({tasks.length > 0 
                        ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) 
                        : 0}%)
                    </Typography>
                  </Box>
                  
                  <Box className={styles.infoItem}>
                    <Typography variant="body2" color="text.secondary">
                      Quá hạn
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      {tasks.filter(task => 
                        task.dueDate && 
                        new Date(task.dueDate) < new Date() && 
                        task.status !== 'completed'
                      ).length}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamManagementDialog;
