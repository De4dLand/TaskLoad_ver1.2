import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Button,
  TextField,
  Divider,
  Stack,
  Grid,
  Checkbox,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getSocket } from "../../../../../services/socket";
import { createSubtask, getSubtasksByTask, updateSubtask, deleteSubtask } from "../../../../features/tasks/services/subtaskService";
import { updateTask } from "../../../../features/tasks/services/taskService";

// Utility to format date as dd/MM/yyyy
function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB");
}

const TaskDetailDrawer = ({
  open,
  onClose,
  task,
  onUpdate,
  comments = [],
  onAddComment,
  loading = false,
  currentUser = {},
  projectMembers = [],
  isProjectOwner = false,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  
  // Status progression order
  const statusOrder = ['new', 'assigned', 'todo', 'in_progress', 'reviewing', 'completed'];
  
  // Check if current user is assigned to this task
  const isAssignedToCurrentUser = task?.assignedTo?.user === currentUser?._id 
  
  // Check if user can edit (owner or assigned member)
  const canEdit = isProjectOwner || isAssignedToCurrentUser;
  const [commentInput, setCommentInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [liveComments, setLiveComments] = useState(comments || []);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskLoading, setSubtaskLoading] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Socket.io setup
  useEffect(() => {
    if (!task || !task._id) return;
    if (!open) return;

    // Connect socket if not already
    if (!socketRef.current) {
      socketRef.current = getSocket(currentUser);
    }
    const socket = socketRef.current;

    // Join task room (optional for scalability)
    socket.emit('task:join', { taskId: task._id });

    // Send user info if available
    if (currentUser && currentUser._id) {
      socket.emit('user:login', {
        userId: currentUser._id,
        username: currentUser.firstName || currentUser.username || 'Anonymous'
      });
    }

    // Listen for newComment events globally
    const handleNewComment = (data) => {
      // Only add if for this task
      if (data && data.taskId === task._id && data.comment) {
        setLiveComments((prev) => [...prev, data.comment]);
      }
    };

    // Listen for typing indicator updates
    const handleTypingUpdate = (data) => {
      if (data && data.taskId === task._id) {
        // Filter out current user from typing users
        const otherTypingUsers = data.typingUsers.filter(
          user => user.userId !== currentUser?._id
        );
        setTypingUsers(otherTypingUsers);
      }
    };

    // Listen for comment errors
    const handleCommentError = (data) => {
      setCommentError(data.error);
      // Clear error after 5 seconds
      setTimeout(() => setCommentError(null), 5000);
    };

    // Listen for deleted comments
    const handleCommentDeleted = (data) => {
      if (data && data.taskId === task._id && data.commentId) {
        setLiveComments((prev) => 
          prev.filter(comment => comment._id.toString() !== data.commentId)
        );
      }
    };

    // Register event listeners
    socket.on('newComment', handleNewComment);
    socket.on('comment:typingUpdate', handleTypingUpdate);
    socket.on('comment:error', handleCommentError);
    socket.on('comment:deleted', handleCommentDeleted);

    // Request all comments for this task
    socket.emit('comment:getAll', { taskId: task._id });

    // Handle receiving all comments
    const handleAllComments = (data) => {
      if (data && data.taskId === task._id && Array.isArray(data.comments)) {
        setLiveComments(data.comments);
      }
    };
    socket.on('comment:allComments', handleAllComments);

    return () => {
      // Clean up typing indicator when component unmounts
      if (isTyping) {
        socket.emit('comment:typing', {
          taskId: task._id,
          isTyping: false,
          userId: currentUser?._id,
          username: currentUser?.firstName || currentUser?.username
        });
      }
      
      socket.emit('task:leave', { taskId: task._id });
      
      // Remove all event listeners
      socket.off('newComment', handleNewComment);
      socket.off('comment:typingUpdate', handleTypingUpdate);
      socket.off('comment:error', handleCommentError);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('comment:allComments', handleAllComments);
    };
  }, [task?._id, open, currentUser, isTyping]);

  // Sync props.comments to liveComments on open/task change
  useEffect(() => {
    setLiveComments(comments || []);
  }, [comments, task?._id, open]);
  
  // Reset edit mode and edited task when task changes
  useEffect(() => {
    setEditMode(false);
    if (task) {
      setEditedTask({ ...task });
      // Ensure assignedTo is always an array
      if (task.assignedTo && !Array.isArray(task.assignedTo)) {
        setEditedTask(prev => ({ ...prev, assignedTo: [task.assignedTo] }));
      }
    }
  }, [task]);

  const handleFieldChange = (field, value) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch subtasks when task changes or drawer opens
  // useEffect(() => {
  //   if (task && task._id && open) {
  //     fetchSubtasks(task._id);
  //   }
  // }, [task?._id, open]);

  // Fetch subtasks from the API
  const fetchSubtasks = async (taskId) => {
    try {
      setSubtaskLoading(true);
      const fetchedSubtasks = await getSubtasksByTask(taskId);
      setSubtasks(fetchedSubtasks);
      // Update editedTask with fetched subtasks
      setEditedTask(prev => ({ ...prev, subtasks: fetchedSubtasks }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setSubtaskLoading(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId, completed) => {
    try {
      // Update in the UI optimistically
      setSubtasks(prev => 
        prev.map(st => st._id === subtaskId ? { ...st, completed: !completed } : st)
      );
      
      // Update in the editedTask state
      setEditedTask(prev => ({
        ...prev,
        subtasks: (prev.subtasks || []).map(st => 
          st._id === subtaskId ? { ...st, completed: !completed } : st
        )
      }));
      
      // Send update to the server
      await updateSubtask(subtaskId, { completed: !completed });
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      // Revert the optimistic update if there's an error
      fetchSubtasks(task._id);
    }
  };

  const handleAddSubtask = async () => {
    console.log(task)
    if (subtaskInput.trim()) {
      try {
        // Create new subtask data
        const newSubtaskData = {
          title: subtaskInput.trim(),
          completed: false,
        };
        
        // Add to the server
        const createdSubtask = await updateTask(task._id, { ...task, subtasks: [...task.subtasks, newSubtaskData] });
        
        // Update local state
        setSubtasks(prev => [...prev, createdSubtask]);
        setEditedTask(prev => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), createdSubtask]
        }));
        
        // Clear input
        setSubtaskInput("");
      } catch (error) {
        console.error('Error adding subtask:', error);
      }
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      // Remove from UI optimistically
      setSubtasks(prev => prev.filter(st => st._id !== subtaskId));
      
      // Update in the editedTask state
      setEditedTask(prev => ({
        ...prev,
        subtasks: (prev.subtasks || []).filter(st => st._id !== subtaskId)
      }));
      
      // Delete from the server
      await deleteSubtask(subtaskId);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      // Revert the optimistic update if there's an error
      fetchSubtasks(task._id);
    }
  };

  const handleSave = () => {
    if (onUpdate) onUpdate(task._id, editedTask);
    setEditMode(false);
  };
  
  // Handle status change to next in sequence
  const handleNextStatus = () => {
    if (!task?.status) return;
    
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1 || currentIndex >= statusOrder.length - 1) return;
    
    const nextStatus = statusOrder[currentIndex + 1];
    if (onUpdate) onUpdate(task._id, { status: nextStatus });
  };
  
  // Handle status change
  const handleStatusChange = (newStatus) => {
    if (onUpdate) onUpdate(task._id, { status: newStatus });
  };
  
  // Handle priority change
  const handlePriorityChange = (newPriority) => {
    if (onUpdate) onUpdate(task._id, { priority: newPriority });
  };

  // Handle typing indicator
  const handleCommentInputChange = (e) => {
    const value = e.target.value;
    setCommentInput(value);
    
    // Handle typing indicator
    if (socketRef.current && task && task._id) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Only emit typing event if not already typing
      if (!isTyping && value.trim()) {
        socketRef.current.emit('comment:typing', {
          taskId: task._id,
          isTyping: true,
          userId: currentUser?._id,
          username: currentUser?.firstName || currentUser?.username
        });
        setIsTyping(true);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          socketRef.current.emit('comment:typing', {
            taskId: task._id,
            isTyping: false,
            userId: currentUser?._id,
            username: currentUser?.firstName || currentUser?.username
          });
          setIsTyping(false);
        }
      }, 2000);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    
    // Clear any typing indicator
    if (isTyping && socketRef.current) {
      socketRef.current.emit('comment:typing', {
        taskId: task._id,
        isTyping: false,
        userId: currentUser?._id,
        username: currentUser?.firstName || currentUser?.username
      });
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    const newComment = {
      content: commentInput.trim(),
      user: currentUser?._id,
      authorName: currentUser?.firstName || currentUser?.username || 'You',
      profileImage: currentUser?.profileImage || '',
      createdAt: new Date().toISOString(),
    };
    
    // Emit to socket
    if (socketRef.current && task && task._id) {
      socketRef.current.emit('newComment', {
        taskId: task._id,
        comment: newComment,
      });
    }
    
    // Optimistically update UI
    setLiveComments((prev) => [...prev, { ...newComment, user: currentUser?._id }]);
    setCommentInput("");
    
    // Optionally call onAddComment for fallback/persistence
    if (onAddComment) onAddComment(commentInput.trim());
  };
  
  // Handle comment deletion
  const handleDeleteComment = (commentId) => {
    if (socketRef.current && task && task._id && commentId) {
      socketRef.current.emit('comment:delete', {
        taskId: task._id,
        commentId: commentId
      });
    }
  };

  if (!task) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '600px' },
          height: 'calc(100vh - 64px)',
          top: '64px',
          position: 'fixed',
          zIndex: 1200, // Below AppBar (which is 1201)
          '& .MuiDrawer-paper': {
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
          },
        },
      }}
      ModalProps={{
        BackdropProps: {
          style: {
            top: '64px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          top: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", height: "100%" }}>
        {/* Left: Task Details */}
        <Box sx={{ flex: 1, p: 3, overflowY: "auto", minWidth: 380 }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: 'background.paper',
              pt: 2,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" component="h2" noWrap>
                {editMode ? (
                  <TextField
                    value={editedTask?.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    fullWidth
                    variant="standard"
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      '& .MuiInputBase-input': {
                        py: 0.5,
                      },
                    }}
                  />
                ) : (
                  <Box component="span" sx={{ display: 'block', maxWidth: 'calc(100% - 100px)', textOverflow: 'ellipsis' }}>
                    {editedTask?.title}
                  </Box>
                )}
              </Typography>
              <Box>
                {canEdit && (
                  <>
                    {!editMode ? (
                      <IconButton onClick={() => setEditMode(true)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton onClick={handleSave} color="primary" size="small">
                          <CheckIcon />
                        </IconButton>
                        <IconButton size="small">
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                  </>
                )}
                <IconButton onClick={onClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Description */}
          <Box mt={2}>
            <Typography variant="subtitle2">Mô tả</Typography>
            {editMode ? (
              <TextField
                value={editedTask?.description || ""}
                helperText={editedTask?.description?.length > 500 ? "Mô tả không được vượt quá 500 ký tự" : ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{editedTask?.description}</Typography>
            )}
          </Box>

          {/* Dates and Creator */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Ngày bắt đầu</Typography>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={editedTask?.startDate ? dayjs(editedTask.startDate) : null}
                    onChange={(date) => handleFieldChange("startDate", date ? date.toDate() : null)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              ) : (
                <Typography>{formatDate(editedTask?.startDate)}</Typography>
              )}
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Ngày kết thúc</Typography>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={editedTask?.dueDate ? dayjs(editedTask.dueDate) : null}
                    onChange={(date) => handleFieldChange("dueDate", date ? date.toDate() : null)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              ) : (
                <Typography>{formatDate(editedTask?.dueDate)}</Typography>
              )}
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Ngày tạo</Typography>
              <Typography>{formatDate(editedTask?.createdAt)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Người tạo</Typography>
              <Typography>{editedTask?.createdBy?.username || "-"}</Typography>
            </Grid>
          </Grid>

          {/* Assigned To */}
          <Box mt={2}>
            <Typography variant="subtitle2">Người được giao</Typography>
            {editMode && isProjectOwner ? (
              <Box mt={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {assignedUsers.length > 0 ? (
                    assignedUsers.map((user, idx) => (
                      <Chip
                        key={user._id || user.id || idx}
                        avatar={<Avatar src={user.profileImage}>{user.firstName?.[0] || user.username?.[0]}</Avatar>}
                        label={user.firstName || user.username}
                        onDelete={() => {
                          const newAssignedUsers = assignedUsers.filter((u) =>
                            (u._id || u.id) !== (user._id || user.id)
                          );
                          setAssignedUsers(newAssignedUsers);
                          handleFieldChange("assignedTo", newAssignedUsers);
                        }}
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary">No members assigned</Typography>
                  )}
                </Stack>
                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <Select
                    displayEmpty
                    value=""
                    onChange={(e) => {
                      const selectedMemberId = e.target.value;
                      if (!selectedMemberId) return;

                      // Find the selected member from projectMembers
                      const selectedMember = projectMembers.find(m =>
                        (m.user._id || m.user.id) === selectedMemberId
                      )?.user;

                      if (selectedMember) {
                        // Check if user is already assigned
                        const isAlreadyAssigned = assignedUsers.some(u =>
                          (u._id || u.id) === (selectedMember._id || selectedMember.id)
                        );

                        if (!isAlreadyAssigned) {
                          const newAssignedUsers = [...assignedUsers, selectedMember];
                          setAssignedUsers(newAssignedUsers);
                          handleFieldChange("assignedTo", newAssignedUsers);
                        }
                      }
                    }}
                    renderValue={() => "Thêm thành viên"}
                  >
                    <MenuItem value="" disabled>
                      <em>Chọn thành viên</em>
                    </MenuItem>
                    {projectMembers.map((member) => {
                      const memberUser = member.user;
                      const isAlreadyAssigned = assignedUsers.some(u =>
                        (u._id || u.id) === (memberUser._id || memberUser.id)
                      );

                      if (isAlreadyAssigned) return null;

                      return (
                        <MenuItem
                          key={memberUser._id || memberUser.id}
                          value={memberUser._id || memberUser.id}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={memberUser.profileImage}
                              sx={{ width: 24, height: 24 }}
                            >
                              {memberUser.firstName?.[0] || memberUser.username?.[0]}
                            </Avatar>
                            <Typography>
                              {memberUser.firstName || memberUser.username}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
            ) : (
              <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                {(task.assignedToList || task.assignedTo || []).length > 0 ? (
                  (task.assignedToList || task.assignedTo).map((user, idx) => (
                    <Chip
                      key={user._id || user.id || idx}
                      avatar={<Avatar src={user.profileImage}>{user.firstName?.[0] || user.username?.[0]}</Avatar>}
                      label={user.firstName || user.username}
                    />
                  ))
                ) : (
                  <Typography color="text.secondary">Unassigned</Typography>
                )}
                {!editMode && isProjectOwner && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEditMode(true)}
                    sx={{ ml: 1 }}
                  >
                    Quản lý giao việc
                  </Button>
                )}
              </Stack>
            )}
          </Box>

          {/* Priority & Status */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">Độ ưu tiên</Typography>
                {editMode ? (
                  <Select
                    value={editedTask.priority || 'medium'}
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={task?.priority}
                      color={
                        task?.priority === "urgent" ? "error" :
                          task?.priority === "high" ? "error" :
                            task?.priority === "medium" ? "warning" : "default"
                      }
                    />
                    {canEdit && (
                      <IconButton size="small" onClick={() => setEditMode(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">Trạng thái</Typography>
                {editMode ? (
                  <Select
                    value={editedTask.status || 'new'}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    size="small"
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="todo">To Do</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="reviewing">Reviewing</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={task?.status?.replace('_', ' ')} 
                      color={
                        task?.status === 'completed' ? 'success' : 
                        task?.status === 'in_progress' || task?.status === 'reviewing' ? 'primary' : 
                        'default'
                      }
                      variant="outlined"
                    />
                    {isAssignedToCurrentUser && statusOrder.indexOf(task.status) < statusOrder.length - 1 && (
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={handleNextStatus}
                        startIcon={<ArrowForwardIcon />}
                      >
                        Tiếp theo
                      </Button>
                    )}
                    {canEdit && !isAssignedToCurrentUser && (
                      <IconButton size="small" onClick={() => setEditMode(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>  
              <Typography variant="subtitle2">Tags</Typography>
              <Stack direction="row" spacing={1}>
                {(task?.tags || []).map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" />
                ))}
              </Stack>
            </Grid>
          </Grid>

          {/* Subtasks */}
          <Box mt={2}>
            <Typography variant="subtitle2">Subtasks</Typography>
            {subtaskLoading ? (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1} mt={1}>
                {(editedTask?.subtasks || []).map((subtask) => (
                  <Paper 
                    key={subtask._id || subtask.id} 
                    sx={{ p: 1, display: 'flex', alignItems: 'center' }} 
                    variant="outlined"
                  >
                    <Checkbox
                      checked={!!subtask.completed}
                      onChange={() => handleSubtaskToggle(subtask._id, subtask.completed)}
                      disabled={!editMode}
                    />
                    <Typography sx={{ flex: 1 }}>{subtask.title}</Typography>
                    {editMode && (
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteSubtask(subtask._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Paper>
                ))}
                {editMode && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      value={subtaskInput}
                      onChange={e => setSubtaskInput(e.target.value)}
                      size="small"
                      placeholder="Subtask title"
                      fullWidth
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleAddSubtask} 
                      startIcon={<AddIcon />}
                    >
                      Thêm
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </Box>

          {/* Edit/Save Buttons */}
          <Box mt={3} display="flex" gap={2}>
            {editMode ? (
              <>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>Save</Button>
                <Button onClick={() => setEditMode(false)} disabled={loading}>Cancel</Button>
              </>
            ) : canEdit ? (
              <Button 
                variant="outlined" 
                onClick={() => setEditMode(true)} 
                disabled={loading}
                startIcon={<EditIcon />}
              >
                Chỉnh sửa
              </Button>
            ) : null}
          </Box>
        </Box>

        {/* Right: Comments & Updates */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0 }} />
        <Box sx={{ flex: 1, p: 3, overflowY: "auto", minWidth: 350, bgcolor: "#fafbfc" }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Comments & Updates</Typography>
          <Stack spacing={2}>
            {liveComments.length === 0 && (
              <Typography color="text.secondary">No comments yet.</Typography>
            )}
            {liveComments.map((c, idx) => {
              const isCurrentUser = c.user === currentUser?._id || c.user === currentUser?.id;
              return (
                <Box key={idx} sx={{ display: 'flex', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                  <Paper sx={{
                    p: 2,
                    maxWidth: '80%',
                    bgcolor: isCurrentUser ? '#e3f2fd' : '#fff',
                    ml: isCurrentUser ? 'auto' : 0,
                    mr: isCurrentUser ? 0 : 'auto',
                  }} variant="outlined">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={c.profileImage} sx={{ width: 24, height: 24 }}>
                        {c.authorName?.[0] || '?'}
                      </Avatar>
                      <Typography fontWeight="bold">{c.authorName}</Typography>
                      <Typography variant="caption" color="text.secondary" ml={1}>
                        {formatDate(c.createdAt)} {c.createdAt && new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography sx={{ mt: 1 }}>{c.content}</Typography>
                    {isCurrentUser && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          size="small" 
                          color="error" 
                          variant="text" 
                          onClick={() => handleDeleteComment(c._id)}
                        >
                          Xóa
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Stack>
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, px: 2 }}>
              <KeyboardIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </Typography>
            </Box>
          )}
          
          {/* Error Message */}
          {commentError && (
            <Typography color="error" variant="caption" sx={{ mb: 1 }}>
              Error: {commentError}
            </Typography>
          )}
          
          <Box mt={3} component="form" onSubmit={handleCommentSubmit}>
            <TextField
              value={commentInput}
              onChange={handleCommentInputChange}
              placeholder="Write your comment..."
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={loading || !commentInput.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Bình luận   
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default TaskDetailDrawer;
