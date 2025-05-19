import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Button,
  Divider,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import MainLayout from '../../../layouts/MainLayout';
import Workspace from '../components/Workspace/Workspace';
import useAuth from '../../../../hooks/useAuth';
import api from '../../../../services/api';
import { fetchUserWorkspace } from '../services/dashboardService';

const WorkspacePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspaceData, setWorkspaceData] = useState({
    projects: [],
    assignedTasks: [],
    createdTasks: [],
    recentActivity: []
  });
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef(null);

  // Fetch workspace data when component mounts
  useEffect(() => {
    if (user) {
      fetchWorkspaceData();
      fetchUserFiles();
    }
  }, [user]);

  // Fetch workspace data from API
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const data = await fetchUserWorkspace(user._id);
      setWorkspaceData({
        projects: data.projects || [],
        assignedTasks: data.assignedTasks || [],
        createdTasks: data.createdTasks || [],
        recentActivity: data.recentActivity || []
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching workspace data:', err);
      setError('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's uploaded files
  const fetchUserFiles = async () => {
    try {
      const response = await api.get(`/api/v1/files/user/${user._id}`);
      setFiles(response.data || []);
    } catch (err) {
      console.error('Error fetching user files:', err);
      // Don't set error state here to avoid blocking the whole page
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
  };

  // Handle file upload
  const handleFileUpload = async (selectedFiles) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', user._id);

      const response = await api.post('/api/v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Update files list after successful upload
      setFiles(prev => [...prev, ...response.data.files]);
      setUploadProgress(0);
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/api/v1/files/${fileId}`);
      setFiles(prev => prev.filter(file => file._id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file. Please try again.');
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box p={3}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={fetchWorkspaceData} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>My Workspace</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage your tasks, projects, and files in one place
      </Typography>

      <Paper sx={{ mb: 3, p: 0 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Tasks" />
          <Tab label="Projects" />
          <Tab label="Files" />
        </Tabs>
      </Paper>

      {/* Search bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Tab content */}
      {tabValue === 0 && (
        <Box>
          <Workspace />
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>My Projects</Typography>
          <Grid container spacing={3}>
            {workspaceData.projects.length > 0 ? (
              workspaceData.projects
                .filter(project => 
                  searchQuery ? project.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )
                .map(project => (
                  <Grid item xs={12} sm={6} md={4} key={project._id}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        flexDirection: 'column',
                        height: 200,
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6 }
                      }}
                      onClick={() => window.location.href = `/dashboard/projects/${project._id}`}
                    >
                      <Typography variant="h6" noWrap>{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {project.description || 'No description'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ mt: 'auto' }}>
                        <Typography variant="body2">
                          {project.tasks?.length || 0} tasks
                        </Typography>
                        <Typography variant="body2">
                          {project.members?.length || 0} members
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No projects found</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">My Files</Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadClick}
              disabled={uploading}
            >
              Upload Files
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </Box>

          {uploading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2">{`Uploading: ${uploadProgress}%`}</Typography>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#e0e0e0',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: 5,
                    bgcolor: 'primary.main',
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          )}

          <Grid container spacing={2}>
            {files.length > 0 ? (
              files
                .filter(file => 
                  searchQuery ? file.filename.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )
                .map(file => (
                  <Grid item xs={12} sm={6} md={4} key={file._id}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachFileIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body1" noWrap sx={{ maxWidth: 150 }}>
                            {file.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(file.url || `/api/v1/files/${file._id}`, '_blank')}
                        >
                          <CloudUploadIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteFile(file._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No files uploaded yet</Typography>
                  <Button 
                    variant="text" 
                    startIcon={<CloudUploadIcon />} 
                    onClick={handleUploadClick}
                    sx={{ mt: 1 }}
                  >
                    Upload your first file
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default WorkspacePage;