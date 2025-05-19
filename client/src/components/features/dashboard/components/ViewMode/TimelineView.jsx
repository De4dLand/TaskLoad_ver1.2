import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, Tooltip, IconButton } from '@mui/material';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import dayjs from 'dayjs';
import RefreshIcon from '@mui/icons-material/Refresh';

// Utility to get all days between two dates
function getDateRange(start, end) {
  const range = [];
  let d = dayjs(start).startOf('day');
  const e = dayjs(end).startOf('day');
  while (d.isBefore(e) || d.isSame(e)) {
    range.push(d);
    d = d.add(1, 'day');
  }
  return range;
}

// Assign color to each project
function getProjectColor(projectId, projects) {
  const colors = ['#7B61FF', '#00C48C', '#FF647C', '#FFB800', '#1CB0F6', '#FF4F12', '#5B8DEF'];
  const idx = projects.findIndex(p => p._id === projectId);
  return colors[idx % colors.length] || '#888';
}

const TimelineView = ({ tasks = [], projects = [], onTaskClick, onTaskContextMenu }) => {
  // Timeline range: show 2 weeks by default
  const [start] = useState(dayjs().startOf('week').subtract(1, 'day'));
  const days = useMemo(() => getDateRange(start, start.add(13, 'day')), [start]);

  // For mouse hover vertical line
  const [hoverCol, setHoverCol] = useState(null);
  
  // State for tracking modified tasks
  const [modifiedTasks, setModifiedTasks] = useState({});
  
  // Handle refresh button click
  const handleRefresh = () => {
    console.log('Refreshing timeline data...');
    
    // Log detailed information about modified tasks
    if (Object.keys(modifiedTasks).length > 0) {
      console.log('Changes detected:');
      
      Object.entries(modifiedTasks).forEach(([taskId, modifiedTask]) => {
        // Find original task to compare with
        const originalTask = tasks.find(t => t._id === taskId);
        if (originalTask) {
          console.log(`Task modified: ${originalTask.title} (ID: ${taskId})`);
          
          // Compare and log specific changes
          if (originalTask.dueDate !== modifiedTask.dueDate) {
            console.log(`  - Due date changed: ${dayjs(originalTask.dueDate).format('MMM D, YYYY')} → ${dayjs(modifiedTask.dueDate).format('MMM D, YYYY')}`);
          }
          
          // Log other changed properties if needed
          console.log('  - Original task:', originalTask);
          console.log('  - Modified task:', modifiedTask);
        }
      });
      
      // Here you would typically call an API to save changes
      // For example: saveTaskChanges(modifiedTasks);
    } else {
      console.log('No local changes detected');
    }
    
    // Log current tasks for reference
    console.log('Current tasks:', tasks);
  };


  // Today column index
  const todayIdx = days.findIndex(d => d.isSame(dayjs(), 'day'));

  // Map projectId to project
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p._id, p])), [projects]);

  // Sort tasks by project, then by start date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aProj = typeof a.project === 'object' ? a.project._id : a.project;
      const bProj = typeof b.project === 'object' ? b.project._id : b.project;
      if (aProj !== bProj) return String(aProj || '').localeCompare(String(bProj || ''));
      return dayjs(a.dueDate).diff(dayjs(b.dueDate));
    });
  }, [tasks]);
  
  // Handle drag end for task repositioning
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const taskId = draggableId;
    const task = tasks.find(t => t._id === taskId);
    
    if (!task) return;
    
    // Extract day from destination
    const day = parseInt(destination.droppableId);
    const targetDate = days[day].toDate();
    
    // Update the modified tasks state
    setModifiedTasks(prev => ({
      ...prev,
      [taskId]: {
        ...task,
        dueDate: targetDate,
        _modified: true
      }
    }));
    
    // Here you would typically call a function to save the changes
    // For now, we'll just log the change
    console.log('Task moved:', task.title, 'to', targetDate);
  };

  // Get unique users for avatars (optional)
  const getAvatars = (task) => {
    if (!task.assignees && !task.assignedTo) return [];
    const users = Array.isArray(task.assignees) ? task.assignees : [task.assignedTo];
    return users.filter(Boolean);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2, overflowX: 'auto', minHeight: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>Timeline</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              size="small" 
              onClick={handleRefresh} 
              sx={{ mr: 1 }} 
              color="primary"
              title="Refresh timeline data"
            >
              <RefreshIcon />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#888' }}>{days[0].format('D MMM')} - {days[days.length - 1].format('D MMM YYYY')}</Typography>
          </Box>
        </Box>
        {/* Timeline header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '180px repeat(14, 1fr)', alignItems: 'center', mb: 1, position: 'relative' }}>
          <Box />
          {days.map((d, i) => (
            <Box key={i} sx={{ textAlign: 'center', color: '#888', fontWeight: 500, fontSize: 13, position: 'relative', zIndex: 1 }}>{d.format('D')}</Box>
          ))}
          {/* Today line */}
          {todayIdx !== -1 && (
            <Box sx={{
              position: 'absolute',
              left: `calc(180px + ${todayIdx} * 100% / 14)`,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: '#7B61FF',
              zIndex: 10,
              pointerEvents: 'none',
            }}>
              <Box sx={{ position: 'absolute', top: -18, left: -28, bgcolor: '#7B61FF', color: '#fff', px: 1, py: 0.2, borderRadius: 1, fontSize: 12 }}>Today</Box>
            </Box>
          )}
          {/* Mouse hover line */}
          {hoverCol !== null && (
            <Box sx={{
              position: 'absolute',
              left: `calc(180px + ${hoverCol} * 100% / 14)`,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: '#aaa',
              opacity: 0.5,
              zIndex: 9,
              pointerEvents: 'none',
            }} />
          )}
        </Box>
        {/* Timeline body */}
        {projects.map((proj, pi) => (
          <Box key={proj._id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {/* Project name */}
            <Box sx={{ width: 180, pr: 1, fontWeight: 700, color: '#444', fontSize: 15 }}>{proj.name}</Box>
            {/* Tasks for this project */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', alignItems: 'center', position: 'relative', minHeight: 36 }}
              onMouseLeave={() => setHoverCol(null)}
              onMouseMove={e => {
                const bounds = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - bounds.left;
                const col = Math.floor(x / (bounds.width / 14));
                if (col >= 0 && col < 14) setHoverCol(col); else setHoverCol(null);
              }}
            >
              {/* Make each day column droppable */}
              {days.map((day, dayIndex) => (
                <Droppable key={dayIndex} droppableId={String(dayIndex)} type="DEFAULT" direction="vertical">
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ position: 'relative', height: '100%', minHeight: 36 }}
                    >
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              ))}
              
              {sortedTasks.filter(t => t.project === proj._id).map((task, ti) => {
                // Check if task has been modified
                const modifiedTask = modifiedTasks[task._id];
                const taskToRender = modifiedTask || task;
                
                // Use createdAt as start date if startDate is not available
                // This ensures all tasks have a start point on the timeline
                const start = dayjs(taskToRender.startDate || taskToRender.createdAt || taskToRender.dueDate);
                const end = dayjs(taskToRender.dueDate);
                const color = getProjectColor(proj._id, projects);
                
                // Calculate left offset and span - find the closest day in our visible range
                // This handles tasks that might start before or end after our visible timeline
                const left = days.findIndex(d => d.isSame(start, 'day'));
                const right = days.findIndex(d => d.isSame(end, 'day'));
                
                // If both dates are outside our range, check if the task spans our visible timeline
                if (left === -1 && right === -1) {
                  // If task ends before our timeline starts or starts after our timeline ends, don't show it
                  if (end.isBefore(days[0]) || start.isAfter(days[days.length - 1])) {
                    return null;
                  }
                  
                  // Task spans across our timeline, show it from start to end of our visible range
                  const visibleLeft = 0;
                  const visibleRight = days.length - 1;
                  
                  return (
                    <Draggable key={task._id} draggableId={task._id} index={ti} isDragDisabled={false} type="DEFAULT" disableInteractiveElementBlocking={false}>
                      {(provided, snapshot) => (
                        <Tooltip title={`${task.title} (${start.format('MMM D')} - ${end.format('MMM D')})`} arrow>
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              bgcolor: color,
                              color: '#fff',
                              position: 'absolute',
                              left: `calc(${visibleLeft} * 100% / 14 + 2px)`,
                              width: `calc(${visibleRight - visibleLeft + 1} * 100% / 14 - 4px)`,
                              height: 32,
                              borderRadius: 16,
                              display: 'flex',
                              alignItems: 'center',
                              px: 2,
                              boxShadow: 2,
                              cursor: 'pointer',
                              zIndex: 2,
                              ...(taskToRender._modified && {
                                border: '1px dashed #ffeb3b',
                                boxShadow: '0 0 5px rgba(255, 235, 59, 0.5)'
                              }),
                              ...(snapshot.isDragging && {
                                boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
                              })
                            }}
                            onClick={e => onTaskClick && onTaskClick(taskToRender)}
                            onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, taskToRender)}
                          >
                            {getAvatars(taskToRender).map((user, i) => (
                              <Avatar key={i} src={user?.avatar} sx={{ width: 24, height: 24, mr: 1, border: '2px solid #fff' }} />
                            ))}
                            <Typography fontWeight={700} fontSize={14} noWrap>{taskToRender.title}</Typography>
                          </Paper>
                        </Tooltip>
                      )}
                    </Draggable>
                  );
                }
                
                // Handle case where start date is before our timeline
                const visibleLeft = left === -1 ? 0 : left;
                // Handle case where end date is after our timeline
                const visibleRight = right === -1 ? days.length - 1 : right;
                
                return (
                  <Draggable key={task._id} draggableId={task._id} index={ti} isDragDisabled={false} type="DEFAULT" disableInteractiveElementBlocking={false}>
                    {(provided, snapshot) => (
                      <Tooltip title={`${task.title} (${start.format('MMM D')} - ${end.format('MMM D')})`} arrow>
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            bgcolor: color,
                            color: '#fff',
                            position: 'absolute',
                            left: `calc(${visibleLeft} * 100% / 14 + 2px)`,
                            width: `calc(${visibleRight - visibleLeft + 1} * 100% / 14 - 4px)`,
                            height: 32,
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            boxShadow: 2,
                            cursor: 'pointer',
                            zIndex: 2,
                            ...(taskToRender._modified && {
                              border: '1px dashed #ffeb3b',
                              boxShadow: '0 0 5px rgba(255, 235, 59, 0.5)'
                            }),
                            ...(snapshot.isDragging && {
                              boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
                            })
                          }}
                          onClick={e => onTaskClick && onTaskClick(taskToRender)}
                          onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, taskToRender)}
                        >
                          {getAvatars(taskToRender).map((user, i) => (
                            <Avatar key={i} src={user?.avatar} sx={{ width: 24, height: 24, mr: 1, border: '2px solid #fff' }} />
                          ))}
                          <Typography fontWeight={700} fontSize={14} noWrap>{taskToRender.title}</Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Draggable>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default TimelineView;
