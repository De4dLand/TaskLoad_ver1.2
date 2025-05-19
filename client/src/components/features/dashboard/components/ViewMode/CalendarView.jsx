import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper, Tooltip, Chip, Badge, IconButton, Menu, MenuItem, Checkbox, ListItemText, FormControl, InputLabel, Select, Divider, Button, Snackbar, Alert } from '@mui/material';
import { FilterList, Person, AccessTime, Save, DragIndicator } from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { TASK_STATUS, TASK_PRIORITY, TASK_PRIORITY_LABELS } from '../../../../../../../shared/constants/taskStatus';
import axios from 'axios';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

dayjs.extend(relativeTime);

const hours = Array.from({ length: 10 }, (_, i) => 8 + i); // 8:00 - 17:00
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getStartOfWeek(date) {
  const d = dayjs(date);
  const day = d.day() === 0 ? 6 : d.day() - 1;
  return d.subtract(day, 'day');
}

function getMonthMatrix(date) {
  const d = dayjs(date).startOf('month');
  const startDay = d.day() === 0 ? 6 : d.day() - 1;
  const daysInMonth = d.daysInMonth();
  const matrix = [];
  let week = Array(startDay).fill(null);
  let day = 1;
  while (day <= daysInMonth) {
    week.push(day);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
    day++;
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

// Status color mapping
const STATUS_COLORS = {
  new: '#6c757d', // gray
  assigned: '#0d6efd', // blue
  in_progress: '#fd7e14', // orange
  reviewing: '#ffc107', // yellow
  completed: '#198754', // green
};

// Status label mapping
const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  reviewing: 'Reviewing',
  completed: 'Completed',
};

// Priority indicator styles
const PRIORITY_INDICATORS = {
  [TASK_PRIORITY.LOW]: { bgcolor: '#6c757d', label: '!' },
  [TASK_PRIORITY.MEDIUM]: { bgcolor: '#0d6efd', label: '!!' },
  [TASK_PRIORITY.HIGH]: { bgcolor: '#fd7e14', label: '!!!' },
  [TASK_PRIORITY.URGENT]: { bgcolor: '#dc3545', label: '!!!!' },
};

const CalendarView = ({ tasks = [], onTaskClick, onTaskContextMenu }) => {
  const [mode, setMode] = useState('week');
  const [current, setCurrent] = useState(dayjs());
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: [],
  });
  
  // State for tracking modified tasks
  const [modifiedTasks, setModifiedTasks] = useState({});
  const [isSaving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Filter tasks by week/month and applied filters
  const weekStart = getStartOfWeek(current);
  const weekDates = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const monthMatrix = getMonthMatrix(current);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const options = {
      status: [...new Set(tasks.map(t => t.status))],
      priority: [...new Set(tasks.map(t => t.priority))],
      assignee: [...new Set(tasks.filter(t => t.assignedTo).map(t => 
        typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo
      ))],
    };
    return options;
  }, [tasks]);

  // Get assignee name by ID
  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return 'Unassigned';
    const task = tasks.find(t => 
      t.assignedTo && (typeof t.assignedTo === 'object' ? 
        t.assignedTo._id === assigneeId : 
        t.assignedTo === assigneeId
      )
    );
    return task && task.assignedTo && typeof task.assignedTo === 'object' ? 
      task.assignedTo.username || 'Unknown' : 
      'Unknown';
  };

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // If no filters are selected in a category, don't filter by that category
      const statusMatch = filters.status.length === 0 || filters.status.includes(task.status);
      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(task.priority);
      
      // Handle assignee filtering
      const assigneeId = task.assignedTo ? 
        (typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo) : 
        null;
      const assigneeMatch = filters.assignee.length === 0 || 
        (assigneeId && filters.assignee.includes(assigneeId));
      
      return statusMatch && priorityMatch && assigneeMatch;
    });
  }, [tasks, filters]);

  // Map filtered tasks by date (YYYY-MM-DD)
  const tasksByDate = filteredTasks.reduce((acc, t) => {
    // Use modified date if task has been modified
    const taskId = t._id;
    const modifiedTask = modifiedTasks[taskId];
    const date = modifiedTask ? dayjs(modifiedTask.dueDate).format('YYYY-MM-DD') : dayjs(t.dueDate).format('YYYY-MM-DD');
    if (!acc[date]) acc[date] = [];
    acc[date].push(modifiedTask || t);
    return acc;
  }, {});
  
  // Calculate time remaining for a task
  const getTimeRemaining = (dueDate) => {
    const now = dayjs();
    const due = dayjs(dueDate);
    if (due.isBefore(now)) return 'Overdue';
    return due.fromNow();
  };
  
  // Handle filter menu
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
      return newFilters;
    });
  };
  
  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignee: [],
    });
  };
  
  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const taskId = draggableId;
    const task = tasks.find(t => t._id === taskId);
    
    if (!task) return;
    
    // Extract day and hour from destination
    const [day, hour] = destination.droppableId.split('-');
    const targetDate = weekDates[parseInt(day)];
    const targetHour = parseInt(hour);
    
    // Create new date with the target day and hour
    const newDueDate = targetDate.hour(targetHour).minute(0).second(0).toDate();
    
    // Update the modified tasks state
    setModifiedTasks(prev => ({
      ...prev,
      [taskId]: {
        ...task,
        dueDate: newDueDate,
        _modified: true
      }
    }));
  };
  
  // Save changes to the server
  const saveChanges = async () => {
    setSaving(true);
    try {
      const updatePromises = Object.values(modifiedTasks).map(task => {
        return axios.put(`/api/v1/tasks/${task._id}`, {
          dueDate: task.dueDate
        });
      });
      
      await Promise.all(updatePromises);
      
      setSnackbar({
        open: true,
        message: 'Tasks updated successfully',
        severity: 'success'
      });
      
      // Clear modified tasks after successful save
      setModifiedTasks({});
    } catch (error) {
      console.error('Error saving task changes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update tasks',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
        
        <IconButton 
          size="small" 
          sx={{ ml: 1 }} 
          onClick={handleFilterClick}
          color={Object.values(filters).some(f => f.length > 0) ? "primary" : "default"}
        >
          <Badge 
            badgeContent={Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)} 
            color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '9px', height: '14px', minWidth: '14px' } }}
          >
            <FilterList />
          </Badge>
        </IconButton>
        
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          PaperProps={{
            sx: { width: 250, maxHeight: 400 }
          }}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>Filter Tasks</Typography>
          <Divider />
          
          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', mt: 1 }}>Status</Typography>
          {filterOptions.status.map(status => (
            <MenuItem key={status} dense onClick={() => handleFilterChange('status', status)}>
              <Checkbox checked={filters.status.includes(status)} size="small" />
              <ListItemText 
                primary={STATUS_LABELS[status] || status} 
                primaryTypographyProps={{ fontSize: 14 }}
              />
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: STATUS_COLORS[status] || '#ccc',
                  ml: 1
                }} 
              />
            </MenuItem>
          ))}
          
          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', mt: 1 }}>Priority</Typography>
          {filterOptions.priority.map(priority => (
            <MenuItem key={priority} dense onClick={() => handleFilterChange('priority', priority)}>
              <Checkbox checked={filters.priority.includes(priority)} size="small" />
              <ListItemText 
                primary={TASK_PRIORITY_LABELS[priority] || priority} 
                primaryTypographyProps={{ fontSize: 14 }}
              />
              <Box 
                sx={{ 
                  bgcolor: PRIORITY_INDICATORS[priority]?.bgcolor || '#ccc',
                  color: '#fff',
                  fontSize: '10px',
                  px: 0.5,
                  borderRadius: 0.5,
                  ml: 1
                }} 
              >
                {PRIORITY_INDICATORS[priority]?.label || '!'}
              </Box>
            </MenuItem>
          ))}
          
          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', mt: 1 }}>Assignee</Typography>
          {filterOptions.assignee.map(assigneeId => (
            <MenuItem key={assigneeId} dense onClick={() => handleFilterChange('assignee', assigneeId)}>
              <Checkbox checked={filters.assignee.includes(assigneeId)} size="small" />
              <ListItemText 
                primary={getAssigneeName(assigneeId)} 
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </MenuItem>
          ))}
          
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
            <ToggleButton 
              size="small" 
              onClick={clearFilters}
              value="clear"
              selected={false}
            >
              Clear All
            </ToggleButton>
          </Box>
        </Menu>
        
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ mx: 2 }}>{current.format(mode === 'month' ? 'MMMM YYYY' : '[Week of] MMM D, YYYY')}</Typography>
        <ToggleButton size="small" onClick={() => setCurrent(current.subtract(1, mode))}>{'<'}</ToggleButton>
        <ToggleButton size="small" onClick={() => setCurrent(current.add(1, mode))}>{'>'}</ToggleButton>
        </Box>
        
        {/* Save Changes Button */}
        {Object.keys(modifiedTasks).length > 0 && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Save />}
            onClick={saveChanges}
            disabled={isSaving}
            size="small"
          >
            {isSaving ? 'Saving...' : `Save Changes (${Object.keys(modifiedTasks).length})`}
          </Button>
        )}
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {mode === 'week' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', border: '1px solid #444', borderRadius: 2, overflow: 'hidden', background: '#181818' }}>
          <Box sx={{ borderRight: '1px solid #333', bgcolor: '#121212' }}>
            <Box sx={{ height: 40 }} />
            {hours.map(h => (
              <Box key={h} sx={{ height: 60, px: 1, py: 0.5, borderBottom: '1px solid #222', color: '#bbb', fontSize: 13 }}>{`${h}:00`}</Box>
            ))}
          </Box>
          {weekDates.map((date, i) => (
            <Box key={i} sx={{ borderRight: i < 6 ? '1px solid #333' : undefined }}>
              <Box sx={{ height: 40, borderBottom: '1px solid #222', color: '#fff', fontWeight: 700, textAlign: 'center', bgcolor: '#232323' }}>{daysOfWeek[i]}<br />{date.date()}</Box>
              {hours.map(h => {
                const slot = date.hour(h).minute(0).second(0).format('YYYY-MM-DD');
                const dayTasks = tasksByDate[date.format('YYYY-MM-DD')] || [];
                const droppableId = `${i}-${h}`;
                
                return (
                  <Droppable droppableId={droppableId} key={h} direction="vertical">
                    {(provided) => (
                      <Box 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ height: 60, borderBottom: '1px solid #222', position: 'relative' }}
                      >
                        {dayTasks.filter(t => {
                          const due = dayjs(t.dueDate);
                          return due.hour() === h;
                        }).map((t, idx) => (
                          <Draggable key={t._id} draggableId={t._id} index={idx} isDragDisabled={false}>
                            {(provided, snapshot) => (
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="subtitle2">{t.title}</Typography>
                                    <Typography variant="caption" display="block">Project: {t.projectName || 'None'}</Typography>
                                    <Typography variant="caption" display="block">Status: {STATUS_LABELS[t.status] || t.status}</Typography>
                                    <Typography variant="caption" display="block">Priority: {TASK_PRIORITY_LABELS[t.priority] || t.priority}</Typography>
                                    <Typography variant="caption" display="block">Due: {dayjs(t.dueDate).format('MMM D, YYYY h:mm A')}</Typography>
                                    {t.startTime && <Typography variant="caption" display="block">Start: {dayjs(t.startTime).format('h:mm A')}</Typography>}
                                    {t.endTime && <Typography variant="caption" display="block">End: {dayjs(t.endTime).format('h:mm A')}</Typography>}
                                    <Typography variant="caption" display="block">Assigned to: {t.assignedTo?.username || 'Unassigned'}</Typography>
                                  </Box>
                                }
                                arrow
                              >
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    bgcolor: '#222', 
                                    color: '#fff', 
                                    px: 1, 
                                    py: 0.5, 
                                    mb: 0.5, 
                                    position: 'absolute', 
                                    left: 2, 
                                    right: 2, 
                                    top: 2, 
                                    cursor: 'pointer', 
                                    borderLeft: `4px solid ${t.color || STATUS_COLORS[t.status] || '#1976d2'}`,
                                    '&:hover': {
                                      borderColor: STATUS_COLORS[t.status] || '#1976d2',
                                      boxShadow: `0 0 0 1px ${STATUS_COLORS[t.status] || '#1976d2'}`
                                    },
                                    ...(t._modified && {
                                      border: '1px dashed #ffeb3b',
                                      boxShadow: '0 0 5px rgba(255, 235, 59, 0.5)'
                                    }),
                                    ...(snapshot.isDragging && {
                                      boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
                                    })
                                  }}
                                  onClick={e => onTaskClick && onTaskClick(t)}
                                  onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, t)}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography fontSize={13} fontWeight={700} noWrap sx={{ flex: 1 }}>{t.title}</Typography>
                                    <Box 
                                      sx={{ 
                                        bgcolor: PRIORITY_INDICATORS[t.priority]?.bgcolor || '#ccc',
                                        color: '#fff',
                                        fontSize: '9px',
                                        width: 16,
                                        height: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        ml: 0.5
                                      }}
                                    >
                                      {PRIORITY_INDICATORS[t.priority]?.label.charAt(0) || '!'}
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography fontSize={11} color="#aaa" noWrap sx={{ flex: 1 }}>{t.projectName || ''}</Typography>
                                    <Typography fontSize={10} color="#aaa">
                                      {dayjs(t.dueDate).format('h:mm A')}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: 9 }}>
                                    <Person sx={{ fontSize: 10, mr: 0.5, color: '#aaa' }} />
                                    <Typography fontSize={9} color="#aaa" noWrap sx={{ mr: 1 }}>
                                      {t.assignedTo?.username || 'Unassigned'}
                                    </Typography>
                                    <DragIndicator sx={{ fontSize: 10, color: '#aaa', ml: 'auto' }} />
                                  </Box>
                                </Paper>
                              </Tooltip>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                );
              })}
            </Box>
          ))}
        </Box>
        </DragDropContext>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #444', borderRadius: 2, overflow: 'hidden', background: '#181818' }}>
          {daysOfWeek.map((d, i) => (
            <Box key={i} sx={{ textAlign: 'center', fontWeight: 700, color: '#fff', bgcolor: '#232323', borderBottom: '1px solid #222', py: 1 }}>{d}</Box>
          ))}
          {monthMatrix.flat().map((day, idx) => {
            const cellDate = day ? current.startOf('month').add(day - 1, 'day') : null;
            const cellTasks = cellDate ? tasksByDate[cellDate.format('YYYY-MM-DD')] || [] : [];
            return (
              <Box key={idx} sx={{ minHeight: 60, borderRight: (idx % 7) < 6 ? '1px solid #222' : undefined, borderBottom: '1px solid #222', px: 1, py: 0.5, bgcolor: day ? '#181818' : '#232323', position: 'relative', opacity: day ? 1 : 0.5 }}>
                {day && <Typography fontSize={13} fontWeight={700} color="#fff">{day}</Typography>}
                {cellTasks.map((t, i) => (
                  <Tooltip 
                    key={t._id || i}
                    title={
                      <Box>
                        <Typography variant="subtitle2">{t.title}</Typography>
                        <Typography variant="caption" display="block">Project: {t.projectName || 'None'}</Typography>
                        <Typography variant="caption" display="block">Status: {STATUS_LABELS[t.status] || t.status}</Typography>
                        <Typography variant="caption" display="block">Priority: {TASK_PRIORITY_LABELS[t.priority] || t.priority}</Typography>
                        <Typography variant="caption" display="block">Due: {dayjs(t.dueDate).format('MMM D, YYYY h:mm A')}</Typography>
                        <Typography variant="caption" display="block">Assigned to: {t.assignedTo?.username || 'Unassigned'}</Typography>
                      </Box>
                    }
                    arrow
                  >
                    <Paper
                      sx={{ 
                        bgcolor: '#222', 
                        color: '#fff', 
                        px: 1, 
                        py: 0.5, 
                        my: 0.5, 
                        cursor: 'pointer', 
                        borderLeft: `4px solid ${t.color || '#1976d2'}`,
                        '&:hover': {
                          borderColor: STATUS_COLORS[t.status] || '#1976d2',
                          boxShadow: `0 0 0 1px ${STATUS_COLORS[t.status] || '#1976d2'}`
                        }
                      }}
                      onClick={e => onTaskClick && onTaskClick(t)}
                      onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, t)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography fontSize={12} fontWeight={700} noWrap sx={{ flex: 1 }}>{t.title}</Typography>
                        <Box 
                          sx={{ 
                            bgcolor: PRIORITY_INDICATORS[t.priority]?.bgcolor || '#ccc',
                            color: '#fff',
                            fontSize: '9px',
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            ml: 0.5
                          }}
                        >
                          {PRIORITY_INDICATORS[t.priority]?.label.charAt(0) || '!'}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography fontSize={10} color="#aaa" noWrap sx={{ flex: 1 }}>{t.projectName || ''}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: 9 }}>
                        <Person sx={{ fontSize: 10, mr: 0.5, color: '#aaa' }} />
                        <Typography fontSize={9} color="#aaa" noWrap sx={{ mr: 1 }}>
                          {t.assignedTo?.username || 'Unassigned'}
                        </Typography>
                        <AccessTime sx={{ fontSize: 10, mr: 0.5, color: '#aaa' }} />
                        <Typography fontSize={9} color="#aaa" noWrap>
                          {getTimeRemaining(t.dueDate)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Tooltip>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default CalendarView;
