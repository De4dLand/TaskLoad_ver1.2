import React, { useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import dayjs from 'dayjs';

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

const CalendarView = ({ tasks = [], onTaskClick, onTaskContextMenu }) => {
  const [mode, setMode] = useState('week');
  const [current, setCurrent] = useState(dayjs());

  // Filter tasks by week/month
  const weekStart = getStartOfWeek(current);
  const weekDates = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const monthMatrix = getMonthMatrix(current);

  // Map tasks by date (YYYY-MM-DD)
  const tasksByDate = tasks.reduce((acc, t) => {
    const date = dayjs(t.dueDate).format('YYYY-MM-DD');
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ mx: 2 }}>{current.format(mode === 'month' ? 'MMMM YYYY' : '[Week of] MMM D, YYYY')}</Typography>
        <ToggleButton size="small" onClick={() => setCurrent(current.subtract(1, mode))}>{'<'}</ToggleButton>
        <ToggleButton size="small" onClick={() => setCurrent(current.add(1, mode))}>{'>'}</ToggleButton>
      </Box>
      {mode === 'week' ? (
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
                return (
                  <Box key={h} sx={{ height: 60, borderBottom: '1px solid #222', position: 'relative' }}>
                    {dayTasks.filter(t => {
                      const due = dayjs(t.dueDate);
                      return due.hour() === h;
                    }).map((t, idx) => (
                      <Paper
                        key={t._id || idx}
                        sx={{ bgcolor: '#222', color: '#fff', px: 1, py: 0.5, mb: 0.5, position: 'absolute', left: 2, right: 2, top: 2, cursor: 'pointer', borderLeft: `4px solid ${t.color || '#1976d2'}` }}
                        onClick={e => onTaskClick && onTaskClick(t)}
                        onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, t)}
                      >
                        <Typography fontSize={13} fontWeight={700} noWrap>{t.title}</Typography>
                        <Typography fontSize={11} color="#aaa" noWrap>{t.projectName || ''}</Typography>
                      </Paper>
                    ))}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
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
                  <Paper
                    key={t._id || i}
                    sx={{ bgcolor: '#222', color: '#fff', px: 1, py: 0.5, my: 0.5, cursor: 'pointer', borderLeft: `4px solid ${t.color || '#1976d2'}` }}
                    onClick={e => onTaskClick && onTaskClick(t)}
                    onContextMenu={e => onTaskContextMenu && onTaskContextMenu(e, t)}
                  >
                    <Typography fontSize={12} fontWeight={700} noWrap>{t.title}</Typography>
                    <Typography fontSize={10} color="#aaa" noWrap>{t.projectName || ''}</Typography>
                  </Paper>
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
