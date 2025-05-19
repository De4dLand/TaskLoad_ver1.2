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
    // If 'all' or no filters, show all
    if (filters.includes("all") || filters.length === 0) {
      onFilter(tasks);
      return;
    }
    
    // Created filter - show tasks created by project members
    if (filters.includes("created")) {
      // If we have project members, filter by them
      if (projectMembers.length > 0) {
        const memberIds = projectMembers.map(member => member.user._id || member.user.id);
        result = result.filter((t) => {
          const creatorId = typeof t.createdBy === "string" ? t.createdBy : t.createdBy?._id;
          return memberIds.includes(creatorId);
        });
      } else {
        // Fallback to current user if no project is selected
        result = result.filter((t) => {
          const creatorId = typeof t.createdBy === "string" ? t.createdBy : t.createdBy?._id;
          return creatorId === (user._id || user.id);
        });
      }
    }
    
    // Assigned filter - show tasks assigned to project members
    if (filters.includes("assigned")) {
      // If we have project members, filter by them
      if (projectMembers.length > 0) {
        const memberIds = projectMembers.map(member => member.user._id || member.user.id);
        result = result.filter((t) => {
          const assigneeId = typeof t.assignedTo === "string" ? t.assignedTo : t.assignedTo?._id;
          return memberIds.includes(assigneeId);
        });
      } else {
        // Fallback to current user if no project is selected
        result = result.filter((t) => {
          const assigneeId = typeof t.assignedTo === "string" ? t.assignedTo : t.assignedTo?._id;
          return assigneeId === (user._id || user.id);
        });
      }
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
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="created">Created by Team</ToggleButton>
        <ToggleButton value="assigned">Assigned to Team</ToggleButton>
        <ToggleButton value="priority">Priority</ToggleButton>
        <ToggleButton value="dueSoon">Due Soon</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default FilterView;
