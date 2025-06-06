import React, { useState, useEffect } from "react";
import { Box, ToggleButtonGroup, ToggleButton, Typography } from "@mui/material";

const FilterView = ({ tasks, user, onFilter, selectedProject, projectMembers = [] }) => {
  const [filters, setFilters] = useState(["all"]);

  // Multi-select filters: reset when needed, drop 'all' if combined
  const handleFilterChange = (e, newFilters) => {
    // no selection -> all
    if (!newFilters || newFilters.length === 0) {
      setFilters(["all"]);
      return;
    }
    // if 'all' toggled
    if (newFilters.includes("all")) {
      if (filters.includes("all")) {
        // was 'all', user picked others -> drop 'all'
        const others = newFilters.filter((f) => f !== "all");
        setFilters(others.length ? others : ["all"]);
      } else {
        // user selected 'all' among others -> reset to 'all'
        setFilters(["all"]);
      }
      return;
    }
    // normal multi-select
    setFilters(newFilters);
  };

  useEffect(() => {
    let result = tasks;
    const now = new Date();
    const currentUserId = user?._id || user?.id;
    
    // If 'all' or no filters, show all
    if (filters.includes("all") || filters.length === 0) {
      onFilter(tasks);
      return;
    }
    
    // Created by me filter
    if (filters.includes("createdByMe")) {
      result = result.filter((task) => {
        const creatorId = typeof task.createdBy === "string" ? task.createdBy : task.createdBy?._id;
        return creatorId === currentUserId;
      });
    }
    
    // Assigned to me filter
    if (filters.includes("assignedToMe")) {
      result = result.filter((task) => {
        const assigneeId = typeof task.assignedTo === "string" ? task.assignedTo : task.assignedTo?._id;
        return assigneeId === currentUserId;
      });
    }
    // Due soon filter
    if (filters.includes("dueSoon")) {
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter((t) => {
        const d = t.dueDate && new Date(t.dueDate);
        return d && d >= now && d <= week;
      });
    }
    // Priority sort
    if (filters.includes("priority")) {
      const order = { high: 1, medium: 2, low: 3 };
      result = [...result].sort((a, b) => (order[a.priority] || 4) - (order[b.priority] || 4));
    }
    onFilter(result);
  }, [filters, selectedProject, tasks, user, onFilter]);

  return (
    <Box sx={{ my: 2 }}>
      {selectedProject && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Filtering tasks for project: {selectedProject.name}
        </Typography>
      )}
      <ToggleButtonGroup
        value={filters}
        exclusive={false}
        onChange={handleFilterChange}
        aria-label="task filter"
        size="small"
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        <ToggleButton value="all" sx={{ borderRadius: '16px !important' }}>All</ToggleButton>
        <ToggleButton value="createdByMe" sx={{ borderRadius: '16px !important' }}>Created by Me</ToggleButton>
        <ToggleButton value="assignedToMe" sx={{ borderRadius: '16px !important' }}>Assigned to Me</ToggleButton>
        <ToggleButton value="priority" sx={{ borderRadius: '16px !important' }}>Priority</ToggleButton>
        <ToggleButton value="dueSoon" sx={{ borderRadius: '16px !important' }}>Due Soon</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default FilterView;
