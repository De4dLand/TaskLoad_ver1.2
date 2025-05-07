import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ViewList, ViewModule, CalendarToday, Timeline, BarChart } from '@mui/icons-material';

const ViewModeSwitcher = ({ viewMode, setViewMode }) => {
  const internalHandleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={internalHandleViewChange}
      aria-label="view mode"
      sx={{ mb: 2 }}
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