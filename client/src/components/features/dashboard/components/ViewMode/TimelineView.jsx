import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

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
  const [start, setStart] = useState(dayjs().startOf('week').subtract(1, 'day'));
  const days = useMemo(() => getDateRange(start, start.add(13, 'day')), [start]);

  // Map projectId to project
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p._id, p])), [projects]);

  // Sort tasks by project, then by start date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.project !== b.project) return a.project.localeCompare(b.project);
      return dayjs(a.dueDate).diff(dayjs(b.dueDate));
    });
  }, [tasks]);

  // Get unique users for avatars (optional)
  const getAvatars = (task) => {
    if (!task.assignees && !task.assignedTo) return [];
    const users = Array.isArray(task.assignees) ? task.assignees : [task.assignedTo];
    return users.filter(Boolean);
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2, overflowX: 'auto', minHeight: 400 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>Timeline</Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>{days[0].format('D MMM')} - {days[days.length - 1].format('D MMM YYYY')}</Typography>
      </Box>
      {/* Timeline header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '180px repeat(14, 1fr)', alignItems: 'center', mb: 1 }}>
        <Box />
        {days.map((d, i) => (
          <Box key={i} sx={{ textAlign: 'center', color: '#888', fontWeight: 500, fontSize: 13 }}>{d.format('D')}</Box>
        ))}
      </Box>
      {/* Timeline body */}
      {projects.map((proj, pi) => (
        <Box key={proj._id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {/* Project name */}
          <Box sx={{ width: 180, pr: 1, fontWeight: 700, color: '#444', fontSize: 15 }}>{proj.name}</Box>
          {/* Tasks for this project */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', alignItems: 'center', position: 'relative', minHeight: 36 }}>
            {sortedTasks.filter(t => t.project === proj._id).map((task, ti) => {
              // Assume task has startDate and dueDate (or fallback to dueDate)
              const start = dayjs(task.startDate || task.dueDate);
              const end = dayjs(task.dueDate);
              const color = getProjectColor(proj._id, projects);
              // Calculate left offset and span
              const left = days.findIndex(d => d.isSame(start, 'day'));
              const right = days.findIndex(d => d.isSame(end, 'day'));
              if (left === -1 || right === -1) return null;
              return (
                <Tooltip key={task._id || ti} title={task.title} arrow>
                  <Paper
                    sx={{
                      bgcolor: color,
                      color: '#fff',
                      position: 'absolute',
                      left: `calc(${left} * 100% / 14 + 2px)`,
                      width: `calc(${right - left + 1} * 100% / 14 - 4px)`,
                      height: 32,
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      boxShadow: 2,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onClick={e => onTaskClick && onTaskClick(task)}
                    onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, task)}
                  >
                    {getAvatars(task).map((user, i) => (
                      <Avatar key={i} src={user?.avatar} sx={{ width: 24, height: 24, mr: 1, border: '2px solid #fff' }} />
                    ))}
                    <Typography fontWeight={700} fontSize={14} noWrap>{task.title}</Typography>
                  </Paper>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TimelineView;
