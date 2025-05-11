"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Button, CircularProgress, Paper, ToggleButtonGroup, ToggleButton, Snackbar, Alert } from "@mui/material"
import { Add as AddIcon, ViewList, ViewModule, CalendarToday, Timeline, BarChart } from "@mui/icons-material"
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
import useAuth from "../../../../hooks/useAuth"
import FilterView from "../components/FilterView/FilterView"
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Menu, MenuItem, TextField } from "@mui/material"
import FormInput from "../../../common/FormInput"
import AddProjectForm from "../components/AddProjectForm"
import AnalysisLayout from "../components/AnalysisLayout/AnalysisLayout";
import styles from "./DashboardPage.module.css"
import AppSidebar from "../../../layouts/MainLayout/AppSidebar"
import AppHeader from "../../../layouts/MainLayout/AppHeader"

import MemberDialog from '../components/MemberDialog';
import DeadlineSnackbar from '../components/DeadlineSnackbar';
import ViewModeSwitcher from '../components/ViewModeSwitcher';
import TaskDialog from '../components/TaskDialog';
import ProjectDialog from '../components/ProjectDialog';
import ProjectManageDrawer from '../components/ProjectManageDrawer/ProjectManageDrawer';
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
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
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
  // Manages the state for filtered tasks.
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
    if (dashboardData?.tasks) setFilteredTasks(dashboardData.tasks)
  }, [dashboardData])

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
    setContextProject(null)
  }
  
  // Get project members for the selected project
  const getProjectMembers = (projectId) => {
    if (!dashboardData || !dashboardData.projects) return [];
    const project = dashboardData.projects.find(p => p._id === projectId);
    return project?.members || [];
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
  const handleDrawerClose = () => {
    setTaskDrawerOpen(false);
    setDrawerTask(null);
    setDrawerComments([]);
  };
  const handleTaskUpdate = async (updatedTask) => {
    try {
      const result = await updateTask(updatedTask._id, updatedTask);
      setDashboardData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t._id === result._id ? result : t)),
      }));
      setDrawerTask(result);
    } catch (err) {
      // Optionally show error notification
    }
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
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
    setTaskDialogOpen(true)
  }

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false)
    setTaskForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: null, project: "", assignedTo: null, tags: [], estimatedHours: "" })
  }
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target
    setTaskForm(prev => ({ ...prev, [name]: name === "tags" ? value.split(",").map(tag => tag.trim()) : value }))
  }
  const handleDateChange = (date) => {
    setTaskForm(prev => ({ ...prev, dueDate: date }))
  }
  const handleTaskFormSubmit = async () => {
    try {
      // Ensure dueDate is ISO string or undefined
      const formToSend = {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined
      }
      let updatedTask = null;
      if (selectedTask) {
        updatedTask = await updateTask(selectedTask._id, formToSend)
        
        // Emit socket event for task update
        if (socket && updatedTask) {
          socket.emit('taskUpdate', {
            taskId: updatedTask._id,
            title: updatedTask.title,
            updatedBy: user.name,
            assignedTo: updatedTask.assignedTo?._id
          });
        }
      } else {
        const newTask = await createTask(formToSend)
        
        // Emit socket event for task creation
        if (socket && newTask && newTask.assignedTo) {
          socket.emit('taskAssign', {
            taskId: newTask._id,
            title: newTask.title,
            assignedTo: newTask.assignedTo._id,
            assignedBy: user.name
          });
        }
      }
      // Optimistically update dashboardData.tasks if updateTask returns the updated task
      if (selectedTask && updatedTask && dashboardData?.tasks) {
        setDashboardData({
          ...dashboardData,
          tasks: dashboardData.tasks.map(t => t._id === updatedTask._id ? updatedTask : t)
        })
      } else {
        loadData()
      }
      handleCloseTaskDialog()
    } catch (err) {
      let errorMsg = err?.response?.data?.message || err.message || 'Unknown error';
      setError(selectedTask ? `Error updating task: ${errorMsg}` : `Error creating task: ${errorMsg}`);
      console.error(selectedTask ? "Error updating task:" : "Error creating task:", err)
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

  const handleSearchUsers = async () => {
    if (!memberSearchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    try {
      const users = await searchUsers(memberSearchQuery.trim())
      setMemberResults(users)
    } catch (err) {
      console.error("Search users failed", err)
      setSearchError("Failed to fetch users")
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
            New Project
          </Button>
          {dashboardData?.projects && (
            <ProjectSidebar
              sidebarData={dashboardData}
              onProjectContextMenu={handleProjectContextMenu}
            />
          )}
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, overflowY: 'auto' }}>
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
                Add Task
              </Button>
            </Box>
            <ProjectMemberInfo 
              user={user}
              projectMembers={dashboardData?.projects?.find(p => p._id === selectedProject?._id)?.members || []}
            />
            <FilterView
              tasks={dashboardData?.tasks || []}
              projects={dashboardData?.projects || []}
              user={user}
              onFilter={setFilteredTasks}
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
            startDate: formData.startDate ? formData.startDate.toISOString() : null,
            endDate: formData.dueDate ? formData.dueDate.toISOString() : null,
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
        taskform={taskForm}
        onChange={handleTaskFormChange}
        onDateChange={handleDateChange}
        projects={dashboardData?.projects}
        users={dashboardData?.users}
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
              await updateProject(contextProject._id, formData);
              loadData();
            } catch (err) {
              console.error('Failed to update project:', err);
            }
          }}
          onAddMember={async (user, role) => {
            try {
              await addProjectMember(contextProject._id, user._id, role);
              loadData();
            } catch (err) {
              console.error('Failed to add member:', err);
            }
          }}
          onRemoveMember={async (memberId) => {
            try {
              await removeMember(contextProject._id, memberId);
              loadData();
            } catch (err) {
              console.error('Failed to remove member:', err);
            }
          }}
          onSearchMembers={searchUsers}
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