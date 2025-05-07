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
  const [start] = useState(dayjs().startOf('week').subtract(1, 'day'));
  const days = useMemo(() => getDateRange(start, start.add(13, 'day')), [start]);

  // For mouse hover vertical line
  const [hoverCol, setHoverCol] = useState(null);

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
