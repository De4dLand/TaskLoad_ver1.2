"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton, Snackbar, Alert } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule, CalendarToday, Timeline, BarChart, GroupAdd as GroupAddIcon } from "@mui/icons-material"
import TaskList from "../components/TaskList/TaskList"
import TaskGrid from "../components/TaskGrid/TaskGrid"
//
import TaskDetailDrawer from "../components/TaskDetailDrawer/TaskDetailDrawer"
import ListView from "../components/ViewMode/ListView"
import GridView from "../components/ViewMode/GridView"
import CalendarView from "../components/ViewMode/CalendarView"
import TimelineView from "../components/ViewMode/TimelineView"
import StatsView from "../components/ViewMode/StatsView"
//
import ProjectSidebar from "../components/ProjectSidebar/ProjectSidebar"
import DataNotFound from "../../../common/DataNotFound"
import { fetchDashboardData, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask, addProjectMember, searchUsers } from "../services/dashboardService"
import teamService from "../services/teamService"
import useAuth from "../../../../hooks/useAuth"
import FilterView from "../components/FilterView/FilterView"
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Menu, MenuItem, TextField, Divider } from "@mui/material"
import FormInput from "../../../common/FormInput"
import AddProjectForm from "../components/AddProjectForm"
import AnalysisLayout from "../components/AnalysisLayout/AnalysisLayout";
import styles from "./DashboardPage.module.css"
import AppSidebar from "../../../layouts/MainLayout/AppSidebar"
import AppHeader from "../../../layouts/MainLayout/AppHeader"

import MemberDialog from '../components/MemberDialog';
import DeadlineSnackbar from '../components/DeadlineSnackbar';
import ViewModeSwitcher from '../components/ViewModeSwitcher';
import TaskDialog from '../components/TaskDialog/TaskDialog';
import ProjectDialog from '../components/ProjectDialog';
import ProjectManageDrawer from '../components/ProjectManageDrawer/ProjectManageDrawer';
import { TeamManagementButton } from '../components/TeamManagement';
import { getSocket, joinRoom } from '../../../../services/socket';
import ProjectMemberInfo from '../components/ProjectMemberInfo/ProjectMemberInfo';

const DashboardPage = () => {
  // --- Potential Component: DashboardState --- 
  // This section manages the core state of the dashboard, including data, loading, errors, and view modes.
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { user, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("list")
  // --- End Potential Component: DashboardState ---

  // --- Potential Component: TaskDialogStateAndHandlers --- 
  // Manages state and handlers for the task creation/editing dialog.
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo", priority: "medium", startDate: null, dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
  const [selectedTask, setSelectedTask] = useState(null)
  // --- End Potential Component: TaskDialogStateAndHandlers ---

  // --- Potential Component: ContextMenuState --- 
  // Manages state for context menus (tasks and projects).
  const [contextMenu, setContextMenu] = useState(null)
  const [contextTask, setContextTask] = useState(null)
  const [contextProject, setContextProject] = useState(null)
  // --- End Potential Component: ContextMenuState ---

  // --- Potential Component: ProjectDialogStateAndHandlers --- 
  // Manages state and handlers for the project creation/editing dialog.
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: "", description: "", color: "#1976d2", status: "", startDate: "", endDate: "" })
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectManageDrawerOpen, setProjectManageDrawerOpen] = useState(false)
  // --- End Potential Component: ProjectDialogStateAndHandlers ---

  // --- Potential Component: FilterState --- 
  // Manages the state for filtered tasks and selected project.
  const [filteredTasks, setFilteredTasks] = useState([])
  // --- End Potential Component: FilterState ---

  // --- Potential Component: MemberManagementStateAndHandlers --- 
  // Manages state and handlers for the member management dialog.
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [memberResults, setMemberResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [selectedMembers, setSelectedMembers] = useState([]); // [{ user, role, position, startDate }]
  
  // Team management state
  const [teamManagementOpen, setTeamManagementOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [currentTeam, setCurrentTeam] = useState(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState(null)
  // --- End Potential Component: MemberManagementStateAndHandlers ---

  // --- Potential Component: TaskDetailDrawerState --- 
  // Manages state for the task detail drawer.
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState(null);
  const [drawerComments, setDrawerComments] = useState([]);
  // --- End Potential Component: TaskDetailDrawerState ---

  // --- Potential Component: RealtimeNotifications --- 
  // Manages Socket.IO connection and various alerts.
  const [socket, setSocket] = useState(null);
  const [deadlineAlert, setDeadlineAlert] = useState({ open: false, message: "" });
  const [notification, setNotification] = useState({ open: false, message: "", type: "info" });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  // --- End Potential Component: RealtimeNotifications ---

  useEffect(() => {
    if (dashboardData?.tasks) {
      // If a project is selected, filter tasks for that project
      if (selectedProject) {
        const projectTasks = dashboardData.tasks.filter(task => {
          const projectId = typeof task.project === 'string' ? task.project : task.project?._id;
          return projectId === selectedProject._id;
        });
        setFilteredTasks(projectTasks);
      } else {
        setFilteredTasks(dashboardData.tasks);
      }
    }
  }, [dashboardData, selectedProject])

  // --- Socket.IO Connection and Event Handlers --- 
  useEffect(() => {
    if (!user) return; // Only connect if user is authenticated
    
    // Connect to Socket.IO server using the socket service
    const sock = getSocket(user);
    setSocket(sock);
    
    // Connection events
    sock.on('connect', () => {
      console.log('Connected to Socket.IO server');
      // Join user's personal room for targeted notifications
      joinRoom(user._id);
    });
    
    sock.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
    
    sock.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to Socket.IO server after ${attemptNumber} attempts`);
      // Rejoin rooms after reconnection
      joinRoom(user._id);
    });
    
    // Task and deadline notifications
    sock.on('deadlineWarning', (data) => {
      setDeadlineAlert({
        open: true,
        message: `Task "${data.title}" assigned to you is due soon! Deadline: ${new Date(data.dueDate).toLocaleString()}`
      });
    });
    
    sock.on('taskUpdated', (data) => {
      setNotification({
        open: true,
        message: `Task "${data.title}" has been updated by ${data.updatedBy}`,
        type: 'info'
      });
      // Refresh dashboard data to reflect changes
      loadData();
    });
    
    sock.on('taskAssigned', (data) => {
      setNotification({
        open: true,
        message: `You have been assigned to task "${data.title}"`,
        type: 'info'
      });
      // Refresh dashboard data to reflect changes
      loadData();
    });
    
    // Project activity notifications
    sock.on('projectUpdated', (data) => {
      setNotification({
        open: true,
        message: `Project "${data.name}" has been updated`,
        type: 'info'
      });
      // Refresh dashboard data to reflect changes
      loadData();
    });
    
    sock.on('memberAdded', (data) => {
      setNotification({
        open: true,
        message: `${data.memberName} has been added to project "${data.projectName}"`,
        type: 'info'
      });
      // Refresh dashboard data to reflect changes
      loadData();
    });
    
    // Comment system events
    sock.on('newComment', (data) => {
      setNotification({
        open: true,
        message: `New comment on task "${data.taskTitle}" by ${data.author}`,
        type: 'info'
      });
      
      // If the comment is for the currently open task, update comments
      if (drawerTask && drawerTask._id === data.taskId) {
        setDrawerComments(prev => [...prev, data.comment]);
      }
    });
    
    // User presence tracking
    sock.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });
    
    // Typing indicators
    sock.on('userTyping', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.taskId]: [...(prev[data.taskId] || []), data.userName]
      }));
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const updatedUsers = [...(prev[data.taskId] || [])];
          const index = updatedUsers.indexOf(data.userName);
          if (index > -1) {
            updatedUsers.splice(index, 1);
          }
          return {
            ...prev,
            [data.taskId]: updatedUsers
          };
        });
      }, 3000);
    });
    
    // Clean up on unmount
    return () => {
      sock.disconnect();
    };
  }, [user]);
  // --- End Potential Hook: useSocketIO ---

  if (authLoading) return (<Box className={styles.loadingContainer}><CircularProgress /></Box>)
  if (!user) return (<Box className={styles.loadingContainer}>Please login to view dashboard.</Box>)

  // --- Potential Hook: useDashboardLoader --- 
  // This function handles loading dashboard data.
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchDashboardData()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
      setError("Failed to load data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }
  // --- End Potential Hook: useDashboardLoader ---

  // --- Potential Component: TeamManagementHandlers --- 
  // Handlers for team management functionality
  const handleOpenTeamManagement = () => {
    if (selectedProject) {
      // Load team members for the selected project
      loadTeamMembers();
      setTeamManagementOpen(true);
    } else {
      setNotification({
        open: true,
        message: "Please select a project first",
        type: "warning"
      });
    }
  };

  const loadTeamMembers = async () => {
    if (!selectedProject) return;
    
    setTeamLoading(true);
    setTeamError(null);
    
    try {
      // First check if the project has a team associated with it
      if (selectedProject.team) {
        const members = await teamService.getTeamMembers(selectedProject.team);
        setTeamMembers(members);
        setCurrentTeam(selectedProject.team);
      } else {
        // If no team exists, use the project members
        setTeamMembers(selectedProject.members || []);
      }
    } catch (err) {
      console.error("Error loading team members:", err);
      setTeamError("Failed to load team members. Please try again.");
    } finally {
      setTeamLoading(false);
    }
  };
  
  const handleSearchTeamMembers = async (query) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const results = await searchUsers(query);
      setMemberResults(results);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchError("Failed to search users. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleAddTeamMember = async (userId, role) => {
    if (!selectedProject) return;
    
    try {
      if (currentTeam) {
        // If a team exists, add the member to the team
        await teamService.addTeamMember(currentTeam, userId);
      } else {
        // Otherwise add the member to the project
        await addProjectMember(selectedProject._id, userId, role);
      }
      
      // Reload data to reflect changes
      await loadData();
      await loadTeamMembers();
      
      setNotification({
        open: true,
        message: "Team member added successfully",
        type: "success"
      });
    } catch (err) {
      console.error("Error adding team member:", err);
      throw new Error(err.message || "Failed to add team member");
    }
  };
  
  const handleRemoveTeamMember = async (userId) => {
    if (!selectedProject) return;
    
    try {
      if (currentTeam) {
        // If a team exists, remove the member from the team
        await teamService.removeTeamMember(currentTeam, userId);
      } else {
        // Otherwise remove the member from the project
        // This API endpoint would need to be implemented
        await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/members/${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }
      
      // Reload data to reflect changes
      await loadData();
      await loadTeamMembers();
      
      setNotification({
        open: true,
        message: "Team member removed successfully",
        type: "success"
      });
    } catch (err) {
      console.error("Error removing team member:", err);
      throw new Error(err.message || "Failed to remove team member");
    }
  };
  
  const handleUpdateMemberRole = async (userId, role) => {
    if (!selectedProject) return;
    
    try {
      if (currentTeam) {
        // If a team exists, update the member's role in the team
        await teamService.updateMemberRole(currentTeam, userId, role);
      } else {
        // Otherwise update the member's role in the project
        // This API endpoint would need to be implemented
        await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/members/${userId}/role`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role })
        });
      }
      
      // Reload data to reflect changes
      await loadData();
      await loadTeamMembers();
      
      setNotification({
        open: true,
        message: "Member role updated successfully",
        type: "success"
      });
    } catch (err) {
      console.error("Error updating member role:", err);
      throw new Error(err.message || "Failed to update member role");
    }
  };
  
  const handleAssignTask = async (taskId, userId) => {
    try {
      await updateTask(taskId, { assignedTo: userId || null });
      
      // Reload data to reflect changes
      await loadData();
      
      setNotification({
        open: true,
        message: userId ? "Task assigned successfully" : "Task unassigned successfully",
        type: "success"
      });
    } catch (err) {
      console.error("Error assigning task:", err);
      throw new Error(err.message || "Failed to assign task");
    }
  };
  // --- End Potential Component: TeamManagementHandlers ---

  // --- Potential Component: ProjectContextMenuHandlers --- 
  // Handlers for project context menu.
  const handleProjectContextMenu = (event, project) => {
    event.preventDefault()
    setContextProject(project)
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    )
  }

  const handleProjectMenuClose = () => {
    setContextMenu(null)
    // setContextProject(null)
  }
  
  // Get project members for the selected project
  const getProjectMembers = (projectId) => {
    if (!dashboardData || !dashboardData.projects) return [];
    const project = dashboardData.projects.find(p => p._id === projectId);
    return project?.members || [];
  }
  
  // Handle project selection from sidebar
  const handleProjectSelect = (project) => {
    // If clicking the already selected project, deselect it
    if (selectedProject && selectedProject._id === project._id) {
      setSelectedProject(null);
    } else {
      setSelectedProject(project);
    }
  }
  // --- End Potential Component: ProjectContextMenuHandlers ---

  useEffect(() => { loadData() }, [])

  // --- Potential Component: AddProjectHandler --- 
  // Handler for initiating the add project flow.
  const handleAddProject = () => {
    setAddProjectOpen(true);
  };
  // --- End Potential Component: AddProjectHandler ---

  // --- Potential Component: TaskDetailDrawerHandlers --- 
  // Handlers for the task detail drawer.
  const handleTaskClick = (task) => {
    setDrawerTask(task);
    setTaskDrawerOpen(true);
    // TODO: fetch comments for this task from API if needed
    setDrawerComments([]);
  };

  // Handle task updates from the TaskDetailDrawer
  const handleTaskUpdate = async (taskId, updatedTask) => {
    console.log("Updated task:", updatedTask);
    try {
      // Call the updateTask service with the task ID and updated task data
      const result = await updateTask(taskId, updatedTask);
      
      // Update the local state to reflect the changes
      setDashboardData(prevData => ({
        ...prevData,
        tasks: prevData.tasks.map(task => 
          task._id === taskId ? { ...task, ...result } : task
        )
      }));
      
      // Update the drawer task if it's the same task
      if (drawerTask && drawerTask._id === taskId) {
        setDrawerTask(prev => ({ ...prev, ...result }));
      }
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Task updated successfully',
        type: 'success'
      });
      
      return result;
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to update task',
        type: 'error'
      });
      
      throw error; // Re-throw to allow the drawer to handle the error if needed
    }
  };

  const handleDrawerClose = () => {
    setTaskDrawerOpen(false);
    setDrawerTask(null);
    setDrawerComments([]);
  };
  const handleAddComment = async (commentText) => {
    if (!drawerTask || !commentText.trim()) return;
    
    try {
      // Notify others that user is typing
      if (socket) {
        socket.emit('typing', {
          taskId: drawerTask._id,
          userName: user.name
        });
      }
      
      // API call to add comment (replace with your actual API endpoint)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${drawerTask._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: commentText,
          author: user._id
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const newComment = await response.json();
      
      // Update local state
      setDrawerComments(prev => [...prev, newComment]);
      
      // Emit socket event for new comment
      if (socket) {
        socket.emit('comment', {
          taskId: drawerTask._id,
          taskTitle: drawerTask.title,
          comment: newComment,
          author: user.name
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setNotification({
        open: true,
        message: 'Failed to add comment. Please try again.',
        type: 'error'
      });
    }
  };
  
  // Handle typing indicator for comments
  const handleCommentTyping = () => {
    if (socket && drawerTask) {
      socket.emit('typing', {
        taskId: drawerTask._id,
        userName: user.name
      });
    }
  };
  // --- End Potential Component: TaskDetailDrawerHandlers ---

  // --- Potential Component: ProjectDialogHandlers (Edit) --- 
  // Handlers for the project editing dialog.
  const handleCloseProjectDialog = () => {
    setProjectDialogOpen(false)
    setSelectedProject(null)
    setProjectForm({ name: "", description: "", color: "#1976d2", status: "", startDate: "", endDate: "" })
  }

  const handleProjectFormChange = (e) => {
    const { name, value } = e.target
    setProjectForm(prev => ({ ...prev, [name]: value }))
  }

  const handleProjectFormSubmit = async () => {
    try {
      if (selectedProject) {
        await updateProject(selectedProject._id, projectForm)
      } else {
        // Note: Creation is handled by AddProjectForm, this else block might be redundant or for a different flow
        await createProject({ ...projectForm, owner: user._id })
      }
      loadData()
      handleCloseProjectDialog()
    } catch (err) {
      console.error("Error saving project:", err)
    }
  }
  // --- End Potential Component: ProjectDialogHandlers (Edit) ---

  // --- Potential Component: TaskDialogHandlers (Add/Edit) --- 
  // Handlers for the task creation/editing dialog.
  const handleAddTask = () => {
    setSelectedTask(null)
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", startDate: null, dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
    setTaskDialogOpen(true)
  }

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false)
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", startDate: null, dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
  }
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target
    setTaskForm(prev => ({ ...prev, [name]: name === "tags" ? value.split(",").map(tag => tag.trim()) : value }))
  }
  const handleDateChange = (date) => {
    // Handle date from DatePicker (could be a dayjs object or Date object)
    let processedDate = null;
    if (date) {
      // Check if it's a dayjs object (has toDate method)
      if (typeof date.toDate === 'function') {
        processedDate = date.toDate();
      } else if (date instanceof Date) {
        processedDate = date;
      } else {
        // Try to convert to Date if it's a string
        processedDate = new Date(date);
        if (isNaN(processedDate.getTime())) {
          processedDate = null;
        }
      }
    }
    setTaskForm(prev => ({ ...prev, startDate: processedDate }))
    setTaskForm(prev => ({ ...prev, dueDate: processedDate }))
  }
  const handleTaskFormSubmit = async (formData, isEdit = false) => {
    try {
      console.log('Received task data in DashboardPage:', formData, 'isEdit:', isEdit);
      
      // The formData should already be properly formatted from TaskDialog
      // but we'll ensure it's in the correct format here as well
      const formToSend = {
        ...formData,
        // Ensure project is a valid ID
        project: formData.project,
        // Ensure assignedTo is either a valid ID or null
        assignedTo: formData.assignedTo || null,
        // Ensure tags is an array
        tags: Array.isArray(formData.tags) ? formData.tags : []
      };
      
      let result;
      if (isEdit && selectedTask) { 
        console.log('Updating task with ID:', selectedTask._id, 'Data:', formToSend);
        result = await updateTask(selectedTask._id, formToSend);
      } else {
        // For new tasks, include the current user's ID as createdBy
        const newTaskData = {
          ...formToSend,
          createdBy: user?.id || user?._id, // Handle both id and _id for user object
          status: 'todo' // Ensure status is set for new tasks
        };
        console.log('Creating new task with data:', newTaskData);
        result = await createTask(newTaskData);
      }
      
      // Update the UI
      if (isEdit && selectedTask && dashboardData?.tasks) {
        // Optimistic update for task edit
        setDashboardData({
          ...dashboardData,
          tasks: dashboardData.tasks.map(t => t._id === selectedTask._id ? result : t)
        });
      } else {
        // Reload all data for new task creation or if optimistic update isn't possible
        loadData();
      }
      
      // Close the dialog and show success notification
      handleCloseTaskDialog();
      setNotification({
        open: true,
        message: isEdit ? 'Task updated successfully' : 'Task created successfully',
        type: 'success'
      });
      
      return result;
    } catch (err) {
      let errorMsg = err?.response?.data?.message || err.message || 'Unknown error';
      console.error(isEdit ? "Error updating task:" : "Error creating task:", err);
      
      // Show error notification with more details
      setNotification({
        open: true,
        message: isEdit ? `Error updating task: ${errorMsg}` : `Error creating task: ${errorMsg}`,
        type: 'error',
        autoHideDuration: 10000 // Show error for longer
      });
      
      // Log the full error for debugging
      console.error('Full error object:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
      }
      
      throw err; // Re-throw to allow the form to handle the error
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      // Use the full ISO string for dueDate if present
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : "",
      project: task.project._id || task.project || "",
      assignedTo: task.assignedTo?._id || null,
      tags: task.tags || [],
      estimatedHours: task.estimatedHours || ""
    })
    setTaskDialogOpen(true)
  }

  const handleTaskContextMenu = (event, task) => {
    event.preventDefault()
    setContextTask(task)
    setDrawerTask(task)
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    )
  }
  // --- End Potential Component: TaskContextMenuHandlers ---

  // --- Potential Component: ViewModeSwitcher --- 
  // Handler for changing the view mode.
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView)
    }
  }
  // --- End Potential Component: ViewModeSwitcher ---

  // --- Potential Component: EditProjectHandler --- 
  // Handler for initiating the edit project flow.
  const handleEditProject = (project) => {
    setSelectedProject(project)
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      color: project.color || "#1976d2",
      status: project.status || "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
    })
    setProjectDialogOpen(true)
  }
  // --- End Potential Component: EditProjectHandler ---

  // --- Potential Component: MemberManagementDialogHandlers --- 
  // Handlers for the member management dialog.
  const handleOpenAddMemberDialog = () => {
    handleProjectMenuClose()
    setMemberDialogOpen(true)
    setMemberSearchQuery("")
    setMemberResults([])
    setSearchError(null)
  }

  const handleSearchUsers = async (query) => {
    // Allow passing query directly (from ProjectManageDrawer) or use memberSearchQuery state
    const searchTerm = query || memberSearchQuery.trim()
    if (!searchTerm) return
    
    setSearchLoading(true)
    setSearchError(null)
    try {
      const users = await searchUsers(searchTerm)
      setMemberResults(users)
      
      // If no users found, show notification
      if (users.length === 0) {
        setNotification({
          open: true,
          message: `No users found matching "${searchTerm}"`,
          type: 'info'
        })
      }
      
      return users // Return users for components that need direct access to results
    } catch (err) {
      console.error("Search users failed", err)
      setSearchError("Failed to fetch users")
      setNotification({
        open: true,
        message: 'Failed to search users. Please try again.',
        type: 'error'
      })
      return []
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectMember = (user) => {
    if (selectedMembers.some(m => m.user._id === user._id)) return;
    setSelectedMembers(prev => [...prev, { user, role: '', position: '', startDate: '' }]);
  };

  const handleMemberFieldChange = (idx, field, value) => {
    setSelectedMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const handleRemoveSelectedMember = (idx) => {
    setSelectedMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveMembers = async () => {
    if (!contextProject || selectedMembers.length === 0) return;
    try {
      for (const member of selectedMembers) {
        await addProjectMember(
          contextProject._id,
          member.user._id,
          member.role || 'member',
          member.position,
          member.startDate
        );
      }
      setSelectedMembers([]);
      setMemberDialogOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to add project members', err);
    }
  };
  // --- End Potential Component: MemberManagementDialogHandlers ---

  if (loading) return (<Box className={styles.loadingContainer}><CircularProgress /></Box>)

  // Error and No Data states could also be a small utility component
  // if (error) {
  //   return <DataNotFound message={error} />
  // }
  // if (dashboardData && dashboardData.projects.length === 0) {
  //   return <DataNotFound message="No projects found" />
  // }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <Box
          className={styles.sidebarContainer}
          sx={{
            width: 280,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: 2,
            overflowY: 'auto'
          }}
        >
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddProject}
            sx={{ mb: 3 }}
          >
            Tạo dự án
          </Button>
          {dashboardData?.projects && (
            <ProjectSidebar
              sidebarData={dashboardData}
              onProjectContextMenu={handleProjectContextMenu}
              onProjectSelect={handleProjectSelect}
              selectedProjectId={selectedProject?._id}
            />
          )}
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, overflowY: 'auto' }}>
          {/* Info Bar */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <ProjectMemberInfo 
              user={user}
              projectMembers={dashboardData?.projects?.find(p => p._id === selectedProject?._id)?.members || []}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedProject && (
                <TeamManagementButton
                  project={selectedProject}
                  team={currentTeam}
                  members={selectedProject?.members || []}
                  tasks={filteredTasks}
                  onAddMember={handleAddTeamMember}
                  onRemoveMember={handleRemoveTeamMember}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onAssignTask={handleAssignTask}
                  onSearchUsers={handleSearchTeamMembers}
                  searchResults={memberResults}
                  searchLoading={searchLoading}
                  searchError={searchError}
                  currentUser={user}
                  badgeCount={teamError ? 1 : 0}
                />
              )}
            </Box>
          </Paper>
          {/* Toolbar */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewModeSwitcher viewMode={viewMode} setViewMode={setViewMode} />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddTask}
                size="small"
              >
                Thêm công việc
              </Button>
            </Box>
            <FilterView
              tasks={dashboardData?.tasks || []}
              user={user}
              onFilter={setFilteredTasks}
              selectedProject={selectedProject}
              projectMembers={selectedProject ? getProjectMembers(selectedProject._id) : []}
            />
          </Paper>

          {/* Task View Area */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 2,
              bgcolor: 'background.paper',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: '100%', p: 2 }}>
                {viewMode === "list" && (
                  <ListView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onTaskContextMenu={handleTaskContextMenu}
                  />
                )}
                {viewMode === "grid" && (
                  <GridView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onTaskContextMenu={handleTaskContextMenu}
                  />
                )}
                {viewMode === "calendar" && (
                  <CalendarView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onTaskContextMenu={handleTaskContextMenu}
                  />
                )}
                {viewMode === "timeline" && (
                  <TimelineView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onTaskContextMenu={handleTaskContextMenu}
                  />
                )}
                {viewMode === "stats" && (
                  <StatsView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onTaskContextMenu={handleTaskContextMenu}
                  />
                )}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Dialogs and Drawers */}
      <AddProjectForm
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onSubmit={async (formData) => {
          setAddProjectOpen(false);
          await createProject({
            name: formData.title,
            description: formData.description,
            color: formData.color,
            template: formData.template,
            startDate: formData.startDate || null,
            endDate: formData.dueDate || null,
            owner: user._id
          });
          loadData();
        }}
      />

      <TaskDetailDrawer
        open={taskDrawerOpen}
        onClose={handleDrawerClose}
        task={drawerTask}
        onUpdate={handleTaskUpdate}
        comments={drawerComments}
        onAddComment={handleAddComment}
        onTyping={handleCommentTyping}
        typingUsers={typingUsers[drawerTask?._id] || []}
        loading={loading}
        currentUser={user}
        projectMembers={drawerTask?.project ? getProjectMembers(typeof drawerTask.project === 'string' ? drawerTask.project : drawerTask.project?._id) : []}
        isProjectOwner={drawerTask?.project && selectedProject ? 
          (selectedProject.owner === user?._id || 
          (typeof selectedProject.owner === 'object' && selectedProject.owner?._id === user?._id)) : false}
      />

      {/* Deadline Alert */}
      <DeadlineSnackbar
        open={deadlineAlert.open}
        message={deadlineAlert.message}
        onClose={() => setDeadlineAlert({ open: false, message: "" })}
      />

      {/* General Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSubmit={handleTaskFormSubmit}
        task={selectedTask}
        projects={dashboardData?.projects || []}
        users={dashboardData?.users || []}
      />

      {/* Context Menus */}
      <Menu
        open={contextMenu !== null && contextTask !== null}
        onClose={() => { setContextMenu(null); setContextTask(null); }}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem 
          onClick={() => { handleEditTask(contextTask); setContextMenu(null); }}
          sx={{ py: 1 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Edit Task
          </Box>
        </MenuItem>
        <MenuItem 
          onClick={() => { deleteTask(contextTask._id).then(() => loadData()); setContextMenu(null); }}
          sx={{ py: 1, color: 'error.main' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Delete Task
          </Box>
        </MenuItem>
        </Menu>
        {/* --- End Potential Component: TaskContextMenu --- */}

        {/* Project Context Menu */}
        <Menu
          open={contextMenu !== null && contextProject !== null}
          onClose={handleProjectMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={() => { setProjectManageDrawerOpen(true); handleProjectMenuClose(); }}>Manage Project</MenuItem>
          <MenuItem onClick={() => { deleteProject(contextProject._id).then(() => { loadData(); handleProjectMenuClose(); }); }}>Delete</MenuItem>
        </Menu>

        {/* Project Management Drawer */}
        <ProjectManageDrawer
          open={projectManageDrawerOpen}
          onClose={() => setProjectManageDrawerOpen(false)}
          project={contextProject}
          onUpdateProject={async (formData) => {
            try {
              if (!contextProject || !contextProject._id) {
                throw new Error('Project not found or project ID is missing');
              }
              console.log('Updating project with data:', formData);
              await updateProject(contextProject._id, formData);
              
              // Emit socket event for project update if socket is available
              if (socket) {
                socket.emit('projectUpdate', {
                  projectId: contextProject._id,
                  name: formData.name,
                  updatedBy: user.name
                });
              }
              
              // Close the drawer after successful update
              setProjectManageDrawerOpen(false);
              
              // Show success notification
              setNotification({
                open: true,
                message: `Project "${formData.name}" has been updated successfully`,
                type: 'success'
              });
              
              // Reload dashboard data
              loadData();
            } catch (err) {
              console.error('Failed to update project:', err);
              setNotification({
                open: true,
                message: `Failed to update project: ${err.message}`,
                type: 'error'
              });
            }
          }}
          onAddMember={async (user, memberData) => {
            try {
              if (!user || !user._id) {
                throw new Error('Valid user is required');
              }
              
              if (!contextProject || !contextProject._id) {
                throw new Error('Project information is missing');
              }
              
              await addProjectMember(contextProject._id, user._id, memberData);
              
              // Emit socket event for member added if socket is available
              if (socket) {
                socket.emit('memberAdd', {
                  projectId: contextProject._id,
                  projectName: contextProject.name,
                  memberId: user._id,
                  memberName: user.name,
                  addedBy: user.name
                });
              }
              
              loadData();
              setNotification({
                open: true,
                message: `${user.name || 'User'} has been added to the project as ${memberData.role}`,
                type: 'success'
              });
            } catch (err) {
              console.error('Failed to add member:', err);
              setNotification({
                open: true,
                message: `Failed to add member: ${err.message}`,
                type: 'error'
              });
            }
          }}
          onRemoveMember={async (memberId) => {
            try {
              if (!contextProject || !contextProject._id) {
                throw new Error('Project not found or project ID is missing');
              }
              if (!memberId) {
                throw new Error('Member ID is required');
              }
              await removeMember(contextProject._id, memberId);
              loadData();
              
              setNotification({
                open: true,
                message: `Member has been removed from the project`,
                type: 'success'
              });
            } catch (err) {
              console.error('Failed to remove member:', err);
              setNotification({
                open: true,
                message: `Failed to remove member: ${err.message}`,
                type: 'error'
              });
            }
          }}
          onSearchMembers={handleSearchUsers}
          searchResults={memberResults}
          searchLoading={searchLoading}
          members={contextProject ? getProjectMembers(contextProject._id) : []}
        />

        {/* ProjectDialog component */}
        <ProjectDialog
          open={projectDialogOpen}
          onClose={handleCloseProjectDialog}
          onSubmit={handleProjectFormSubmit}
          project={selectedProject}
          form={projectForm}
          onChange={handleProjectFormChange}
        />

        {/* MemberDialog is already a component, good. */}
        <MemberDialog
          open={memberDialogOpen}
          onClose={() => setMemberDialogOpen(false)}
          members={selectedMembers}
          onMemberChange={handleMemberFieldChange}
          onRemoveMember={handleRemoveSelectedMember}
          onSave={handleSaveMembers}
          selectedMembers={selectedMembers}
        />
    {/* Deadline notification pop-up */}
    <DeadlineSnackbar
      open={deadlineAlert.open}
      message={deadlineAlert.message}
      onClose={() => setDeadlineAlert({ ...deadlineAlert, open: false })}
    />
  </Box>
  ) 
}
export default DashboardPage