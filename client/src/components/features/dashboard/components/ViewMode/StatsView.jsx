import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Card, CardContent, Divider, useTheme, Tab, Tabs } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import { format, parseISO, subDays } from 'date-fns';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PendingIcon from '@mui/icons-material/Pending';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  PointElement, 
  LineElement
);

const StatsView = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // Fetch task statistics
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch task statistics
        const statsResponse = await axios.get('/api/v1/tasks/stats');
        setTaskStats(statsResponse.data);

        // Fetch activity data for the last 14 days
        const activityResponse = await axios.get('/api/v1/dashboard/activity', {
          params: { days: 14 }
        });
        setActivityData(activityResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Generate placeholder data if real data is not available
  const generatePlaceholderData = () => {
    return {
      total: 25,
      completed: 10,
      inProgress: 8,
      todo: 7,
      overdue: 3,
      dueToday: 2,
      dueThisWeek: 5,
      byPriority: { high: 8, medium: 12, low: 5 },
      completionRate: 40
    };
  };

  // Use real data or placeholder
  const stats = taskStats || generatePlaceholderData();

  // Prepare data for Status Pie Chart
  const statusData = {
    labels: ['Completed', 'In Progress', 'To Do'],
    datasets: [
      {
        data: [stats.completed, stats.inProgress, stats.todo],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.light,
        ],
        borderColor: [
          theme.palette.success.dark,
          theme.palette.info.dark,
          theme.palette.warning.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Priority Pie Chart
  const priorityData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [stats.byPriority.high, stats.byPriority.medium, stats.byPriority.low],
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.success.light,
        ],
        borderColor: [
          theme.palette.error.dark,
          theme.palette.warning.dark,
          theme.palette.success.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Due Date Bar Chart
  const dueDateData = {
    labels: ['Overdue', 'Due Today', 'Due This Week'],
    datasets: [
      {
        label: 'Tasks',
        data: [stats.overdue, stats.dueToday, stats.dueThisWeek],
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
        ],
        borderColor: [
          theme.palette.error.dark,
          theme.palette.warning.dark,
          theme.palette.info.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Activity Line Chart
  const activityChartData = {
    labels: activityData.length > 0 ? activityData.map(item => item.date) : 
      Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'MMM d')),
    datasets: [
      {
        label: 'Tasks Created',
        data: activityData.length > 0 ? activityData.map(item => item.created) : 
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 5)),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '80',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Tasks Completed',
        data: activityData.length > 0 ? activityData.map(item => item.completed) : 
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 4)),
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light + '80',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Task Analytics Dashboard</Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.success.light }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TaskAltIcon sx={{ fontSize: 40, color: theme.palette.success.main, mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.completed}</Typography>
                  <Typography variant="body2">Completed Tasks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.info.light }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon sx={{ fontSize: 40, color: theme.palette.info.main, mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.inProgress}</Typography>
                  <Typography variant="body2">In Progress</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.warning.light }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentLateIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.overdue}</Typography>
                  <Typography variant="body2">Overdue Tasks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.error.light }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PriorityHighIcon sx={{ fontSize: 40, color: theme.palette.error.main, mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.byPriority.high}</Typography>
                  <Typography variant="body2">High Priority</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Completion Rate */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Task Completion Rate</Typography>
        <Box display="flex" alignItems="center">
          <Box position="relative" display="inline-flex" sx={{ mr: 3 }}>
            <CircularProgress 
              variant="determinate" 
              value={stats.completionRate} 
              size={80} 
              thickness={5} 
              sx={{ color: theme.palette.success.main }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" component="div" color="text.secondary">
                {`${Math.round(stats.completionRate)}%`}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body1">
              You've completed {stats.completed} out of {stats.total} tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep up the good work!
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs for different chart views */}
      <Box sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Task Distribution" />
          <Tab label="Due Dates" />
          <Tab label="Activity Trends" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 350 }}>
              <Typography variant="h6" gutterBottom>Tasks by Status</Typography>
              <Box height={280}>
                <Pie data={statusData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 350 }}>
              <Typography variant="h6" gutterBottom>Tasks by Priority</Typography>
              <Box height={280}>
                <Pie data={priorityData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>Tasks by Due Date</Typography>
          <Box height={330}>
            <Bar data={dueDateData} options={barOptions} />
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>Task Activity (Last 14 Days)</Typography>
          <Box height={330}>
            <Line data={activityChartData} options={lineOptions} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default StatsView;