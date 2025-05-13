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
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import { getSocket } from "../../../../../services/socket";

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
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState(task || {});
  const [commentInput, setCommentInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [liveComments, setLiveComments] = useState(comments || []);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [commentError, setCommentError] = useState(null);
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

  const handleFieldChange = (field, value) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubtaskToggle = (index) => {
    const newSubtasks = [...(editedTask.subtasks || [])];
    newSubtasks[index].completed = !newSubtasks[index].completed;
    setEditedTask((prev) => ({ ...prev, subtasks: newSubtasks }));
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setEditedTask((prev) => ({
        ...prev,
        subtasks: [
          ...(prev.subtasks || []),
          { title: subtaskInput.trim(), completed: false },
        ],
      }));
      setSubtaskInput("");
    }
  };

  const handleSave = () => {
    if (onUpdate) onUpdate(editedTask);
    setEditMode(false);
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
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 800, maxWidth: '100vw' } }}>
      <Box sx={{ display: "flex", flexDirection: "row", height: "100%" }}>
        {/* Left: Task Details */}
        <Box sx={{ flex: 1, p: 3, overflowY: "auto", minWidth: 380 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight="bold">
              {editMode ? (
                <TextField
                  value={editedTask.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  size="small"
                  fullWidth
                  variant="standard"
                />
              ) : (
                task.title
              )}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Description */}
          <Box mt={2}>
            <Typography variant="subtitle2">Description</Typography>
            {editMode ? (
              <TextField
                value={editedTask.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{task.description}</Typography>
            )}
          </Box>

          {/* Dates and Creator */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Start Date</Typography>
              <Typography>{formatDate(task.startDate)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Due Date</Typography>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={editedTask.dueDate ? dayjs(editedTask.dueDate) : null}
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
                <Typography>{formatDate(task.dueDate)}</Typography>
              )}
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Created On</Typography>
              <Typography>{formatDate(task.createdAt)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Created By</Typography>
              <Typography>{task.createdBy?.username || "-"}</Typography>
            </Grid>
          </Grid>

          {/* Assigned To */}
          <Box mt={2}>
            <Typography variant="subtitle2">Assigned To</Typography>
            <Stack direction="row" spacing={1} mt={0.5}>
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
            </Stack>
          </Box>

          {/* Priority & Tags */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Priority</Typography>
              <Chip label={task.priority} color={task.priority === "high" ? "error" : task.priority === "medium" ? "warning" : "default"} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Tags</Typography>
              <Stack direction="row" spacing={1}>
                {(task.tags || []).map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" />
                ))}
              </Stack>
            </Grid>
          </Grid>

          {/* Subtasks */}
          <Box mt={2}>
            <Typography variant="subtitle2">Subtasks</Typography>
            <Stack spacing={1} mt={1}>
              {(editedTask.subtasks || []).map((subtask, idx) => (
                <Paper key={idx} sx={{ p: 1, display: 'flex', alignItems: 'center' }} variant="outlined">
                  <Checkbox
                    checked={!!subtask.completed}
                    onChange={() => editMode && handleSubtaskToggle(idx)}
                    disabled={!editMode}
                  />
                  <Typography sx={{ flex: 1 }}>{subtask.title}</Typography>
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
                  <Button variant="contained" color="primary" onClick={handleAddSubtask} startIcon={<AddIcon />}>Add</Button>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Edit/Save Buttons */}
          <Box mt={3} display="flex" gap={2}>
            {editMode ? (
              <>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>Save</Button>
                <Button onClick={() => setEditMode(false)} disabled={loading}>Cancel</Button>
              </>
            ) : (
              <Button variant="outlined" onClick={() => setEditMode(true)} disabled={loading}>Edit</Button>
            )}
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
                          Delete
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
              Post Comment
            </Button>
            <Typography variant="caption" color="text.secondary" mt={1}>
              @mention team members to notify them
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default TaskDetailDrawer;
