import React, { useState, useEffect } from "react";
import { Box, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const FilterView = ({ tasks, projects, user, onFilter }) => {
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    let result = tasks;
    const now = new Date();
    switch (filter) {
      case "project":
        if (selectedProject) {
          result = tasks.filter((t) => t.project === selectedProject);
        }
        break;
      case "created":
        result = tasks.filter((t) => t.createdBy === user._id || t.createdBy === user.id);
        break;
      case "assigned":
        result = tasks.filter((t) => t.assignedTo === user._id || t.assignedTo === user.id);
        break;
      case "priority":
        const order = { high: 1, medium: 2, low: 3 };
        result = [...tasks].sort((a, b) => (order[a.priority] || 4) - (order[b.priority] || 4));
        break;
      case "dueSoon":
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        result = tasks.filter((t) => {
          const d = t.dueDate && new Date(t.dueDate);
          return d && d >= now && d <= week;
        });
        break;
      default:
        break;
    }
    onFilter(result);
  }, [filter, selectedProject, tasks, user, onFilter]);

  return (
    <Box sx={{ my: 2 }}>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(e, val) => val && setFilter(val)}
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
      {filter === "project" && (
        <FormControl sx={{ ml: 2, minWidth: 120 }} size="small">
          <InputLabel>Project</InputLabel>
          <Select value={selectedProject} label="Project" onChange={(e) => setSelectedProject(e.target.value)}>
            {projects.map((p) => (
              <MenuItem key={p._id || p.id} value={p._id || p.id}>
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
