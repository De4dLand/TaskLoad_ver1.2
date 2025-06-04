import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, Tooltip, IconButton } from '@mui/material';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
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

// Get avatars for task assignees
const getAvatars = (task) => {
  if (!task.assignees && !task.assignedTo) return [];
  const users = Array.isArray(task.assignees) ? task.assignees : [task.assignedTo];
  return users.filter(Boolean);
};

const TimelineView = ({ tasks = [], projects = [], onTaskClick, onTaskContextMenu }) => {
  // Timeline range: show 2 weeks by default
  const [start] = useState(dayjs().startOf('week').subtract(1, 'day'));
  const days = useMemo(() => getDateRange(start, start.add(13, 'day')), [start]);

  // For mouse hover vertical line
  const [hoverCol, setHoverCol] = useState(null);
  
  // State for tracking modified tasks
  const [modifiedTasks, setModifiedTasks] = useState({});
  
  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const taskId = draggableId;
    const task = tasks.find(t => t._id === taskId);
    
    if (!task) return;
    
    // Calculate new date based on drop position
    const dayIndex = parseInt(destination.droppableId);
    const newDate = days[dayIndex].toDate();
    
    // Update the task's date
    const updatedTask = { ...task, dueDate: newDate, _modified: true };
    
    // Update modified tasks state
    setModifiedTasks(prev => ({
      ...prev,
      [taskId]: updatedTask
    }));
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (Object.keys(modifiedTasks).length > 0) {
      console.log('Changes to save:', modifiedTasks);
      // Here you would typically make an API call to save the changes
      setModifiedTasks({});
    }
  };
  
  // Today column index for highlighting
  const todayIdx = days.findIndex(d => d.isSame(dayjs(), 'day'));
  
  // Sort tasks by project and date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aProj = typeof a.project === 'object' ? a.project._id : a.project;
      const bProj = typeof b.project === 'object' ? b.project._id : b.project;
      if (aProj !== bProj) return String(aProj || '').localeCompare(String(bProj || ''));
      return dayjs(a.dueDate).diff(dayjs(b.dueDate));
    });
  }, [tasks]);

  // Group tasks by project for rendering
  const tasksByProject = useMemo(() => {
    const groups = {};
    projects.forEach(project => {
      groups[project._id] = sortedTasks.filter(task => {
        const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
        return taskProjectId === project._id;
      });
    });
    return groups;
  }, [projects, sortedTasks]);

  // Render task item
  const renderTask = (task, project, index) => {
    const taskToRender = modifiedTasks[task._id] || task;
    const start = dayjs(taskToRender.startDate || taskToRender.createdAt || taskToRender.dueDate);
    const end = dayjs(taskToRender.dueDate);
    const color = getProjectColor(project._id, projects);
    
    // Calculate position and width
    const startIndex = days.findIndex(d => d.isSame(start, 'day'));
    const endIndex = days.findIndex(d => d.isSame(end, 'day'));
    
    if (startIndex === -1 && endIndex === -1) {
      return null;
    }
    
    const visibleStart = Math.max(0, startIndex);
    const visibleEnd = Math.min(days.length - 1, endIndex);
    const span = Math.max(1, visibleEnd - visibleStart + 1);
    
    return (
      <Draggable key={task._id} draggableId={task._id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              position: 'absolute',
              left: `calc(${visibleStart * 100}% / 14 + 2px)`,
              width: `calc(${span * 100}% / 14 - 4px)`,
              zIndex: snapshot.isDragging ? 100 : 1,
              height: '32px',
            }}
          >
            <Tooltip title={`${task.title} (${start.format('MMM D')} - ${end.format('MMM D')})`}>
              <Paper
                elevation={snapshot.isDragging ? 3 : 1}
                sx={{
                  bgcolor: color,
                  color: '#fff',
                  height: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...(taskToRender._modified && {
                    border: '1px dashed #ffeb3b',
                    boxShadow: '0 0 5px rgba(255, 235, 59, 0.5)'
                  }),
                }}
                onClick={(e) => onTaskClick?.(taskToRender, e)}
                onContextMenu={(e) => onTaskContextMenu?.(e, taskToRender)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {getAvatars(taskToRender).map((user, i) => (
                    <Avatar 
                      key={i} 
                      src={user?.avatar} 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        mr: 0.5, 
                        border: '1px solid #fff',
                        fontSize: '0.6rem',
                      }} 
                    />
                  ))}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      ml: 0.5, 
                      fontWeight: 500, 
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {taskToRender.title}
                  </Typography>
                </Box>
              </Paper>
            </Tooltip>
          </div>
        )}
      </Draggable>
    );
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
            <Typography variant="body2" sx={{ color: '#888' }}>
              {days[0].format('D MMM')} - {days[days.length - 1].format('D MMM YYYY')}
            </Typography>
          </Box>
        </Box>

        {/* Timeline header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '180px repeat(14, 1fr)', alignItems: 'center', mb: 1, position: 'relative' }}>
          <Box />
          {days.map((d, i) => (
            <Box key={i} sx={{ textAlign: 'center', color: '#888', fontWeight: 500, fontSize: 13, position: 'relative', zIndex: 1 }}>
              {d.format('D')}
            </Box>
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
              <Box sx={{ position: 'absolute', top: -18, left: -28, bgcolor: '#7B61FF', color: '#fff', px: 1, py: 0.2, borderRadius: 1, fontSize: 12 }}>
                Today
              </Box>
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
        <Box sx={{ position: 'relative' }}>
          {projects.map((project) => (
            <Box key={project._id} sx={{ display: 'flex', mb: 1 }}>
              {/* Project name */}
              <Box sx={{ width: 180, pr: 2, fontWeight: 600, color: '#444', fontSize: 14, pt: 1 }}>
                {project.name}
              </Box>
              
              {/* Task row */}
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(14, 1fr)', 
                  flex: 1, 
                  position: 'relative',
                  minHeight: 40,
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const col = Math.floor((x / rect.width) * 14);
                  if (col >= 0 && col < 14) setHoverCol(col);
                }}
                onMouseLeave={() => setHoverCol(null)}
              >
                {days.map((day, dayIndex) => (
                  <Droppable key={dayIndex} droppableId={String(dayIndex)}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          position: 'relative',
                          minHeight: 40,
                          borderRight: '1px solid #f0f0f0',
                        }}
                      >
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
                
                {/* Render tasks for this project */}
                {tasksByProject[project._id]?.map((task, taskIndex) => 
                  renderTask(task, project, taskIndex)
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </DragDropContext>
  );
};

export default TimelineView;
