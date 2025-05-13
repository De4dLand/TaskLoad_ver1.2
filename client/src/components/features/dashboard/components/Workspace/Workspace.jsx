import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TaskList from '../TaskList/TaskList';
import { fetchUserWorkspace } from '../../services/dashboardService';
import useAuth from '../../../../../hooks/useAuth';

const Workspace = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [workspaceTasks, setWorkspaceTasks] = useState({
    created: [],
    assigned: [],
    all: []
  });
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadWorkspaceData();
  }, [user]);

  const loadWorkspaceData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchUserWorkspace(user._id);
      setWorkspaceTasks({
        created: data.createdTasks || [],
        assigned: data.assignedTasks || [],
        all: [...(data.createdTasks || []), ...(data.assignedTasks || [])]
      });
      
      // Extract unique projects from tasks
      const uniqueProjects = new Set();
      [...(data.createdTasks || []), ...(data.assignedTasks || [])].forEach(task => {
        if (task.project && task.project._id) {
          uniqueProjects.add(JSON.stringify({
            _id: task.project._id,
            name: task.project.name
          }));
        }
      });
      
      setProjects(Array.from(uniqueProjects).map(p => JSON.parse(p)));
      setError(null);
    } catch (err) {
      console.error('Error loading workspace data:', err);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search whenever tasks, search query or filters change
    const tasksToFilter = getTasksByTab(tabValue);
    applyFiltersAndSearch(tasksToFilter);
  }, [workspaceTasks, tabValue, searchQuery, filterOptions]);

  const getTasksByTab = (tab) => {
    switch (tab) {
      case 0: return workspaceTasks.all;
      case 1: return workspaceTasks.created;
      case 2: return workspaceTasks.assigned;
      default: return workspaceTasks.all;
    }
  };

  const applyFiltersAndSearch = (tasks) => {
    let filtered = [...tasks];
    
    // Apply status filter
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(task => task.status === filterOptions.status);
    }
    
    // Apply priority filter
    if (filterOptions.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterOptions.priority);
    }
    
    // Apply project filter
    if (filterOptions.project !== 'all') {
      filtered = filtered.filter(task => 
        task.project && task.project._id === filterOptions.project
      );
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTasks(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTaskClick = (task) => {
    // Handle task click - can be implemented to open task details
    console.log('Task clicked:', task);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Workspace</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage all your tasks across different projects
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`All Tasks (${workspaceTasks.all.length})`} />
          <Tab label={`Created by Me (${workspaceTasks.created.length})`} />
          <Tab label={`Assigned to Me (${workspaceTasks.assigned.length})`} />
        </Tabs>
      </Paper>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={filterOptions.status}
            onChange={handleFilterChange}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="inprogress">In Progress</MenuItem>
            <MenuItem value="testing">Testing</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={filterOptions.priority}
            onChange={handleFilterChange}
            label="Priority"
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: '200px' }}>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={filterOptions.project}
            onChange={handleFilterChange}
            label="Project"
          >
            <MenuItem value="all">All Projects</MenuItem>
            {projects.map(project => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box>
        {filteredTasks.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No tasks found matching your criteria
          </Typography>
        ) : (
          <TaskList 
            tasks={filteredTasks} 
            onTaskClick={handleTaskClick}
          />
        )}
      </Box>
    </Box>
  );
};

export default Workspace;