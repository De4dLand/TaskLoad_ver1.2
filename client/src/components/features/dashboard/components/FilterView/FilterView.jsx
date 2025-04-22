import React, { useState, useEffect } from "react";
import { Box, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const FilterView = ({ tasks, projects, user, onFilter }) => {
  const [filters, setFilters] = useState(["all"]);
  const [selectedProject, setSelectedProject] = useState("");

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
    // Project filter
    if (filters.includes("project") && selectedProject) {
      result = result.filter((t) => {
        const pid = typeof t.project === "string" ? t.project : t.project?._id?.toString();
        return pid === selectedProject;
      });
    }
    // Created filter
    if (filters.includes("created")) {
      result = result.filter((t) => t.createdBy === (user._id || user.id));
    }
    // Assigned filter
    if (filters.includes("assigned")) {
      result = result.filter((t) => t.assignedTo === (user._id || user.id));
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
      <ToggleButtonGroup
        value={filters}
        exclusive={false}
        onChange={handleFilterChange}
        aria-label="task filter"
        size="small"
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="project">Project</ToggleButton>
        <ToggleButton value="created">Created</ToggleButton>
        <ToggleButton value="assigned">Assigned</ToggleButton>
        <ToggleButton value="priority">Priority</ToggleButton>
        <ToggleButton value="dueSoon">Due Soon</ToggleButton>
      </ToggleButtonGroup>
      {filters.includes("project") && (
        <FormControl sx={{ ml: 2, minWidth: 120 }} size="small">
          <InputLabel>Project</InputLabel>
          <Select
            value={selectedProject}
            label="Project"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default FilterView;
