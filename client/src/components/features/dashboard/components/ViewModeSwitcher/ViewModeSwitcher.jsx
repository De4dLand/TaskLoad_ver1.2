// Placeholder for ViewModeSwitcher component
import React from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ViewList, ViewModule, CalendarToday, Timeline, BarChart } from '@mui/icons-material';

const ViewModeSwitcher = ({ viewMode, handleViewChange }) => {
  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewChange}
      aria-label="view mode"
    >
      <ToggleButton value="list" aria-label="list view">
        <ViewList />
      </ToggleButton>
      <ToggleButton value="grid" aria-label="grid view">
        <ViewModule />
      </ToggleButton>
      <ToggleButton value="calendar" aria-label="calendar view">
        <CalendarToday />
      </ToggleButton>
      <ToggleButton value="timeline" aria-label="timeline view">
        <Timeline />
      </ToggleButton>
      <ToggleButton value="stats" aria-label="stats view">
        <BarChart />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewModeSwitcher;