import React from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";

// Placeholder for future analysis widgets
const AnalysisLayout = ({ data }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Analysis Smart View
      </Typography>
      <Stack spacing={2}>
        {/* Example analysis widgets (replace with real ones) */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Project Summary</Typography>
          <Typography variant="body2">Total Projects: {data?.projects?.length || 0}</Typography>
          <Typography variant="body2">Total Tasks: {data?.tasks?.length || 0}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Tasks by Status</Typography>
          {/* Example: show counts for each status */}
          {['todo', 'in_progress', 'review', 'completed'].map(status => (
            <Typography key={status} variant="body2">
              {status.replace('_', ' ')}: {data?.tasks?.filter(t => t.status === status).length || 0}
            </Typography>
          ))}
        </Paper>
        {/* Add more analysis widgets here */}
      </Stack>
    </Box>
  );
};

export default AnalysisLayout;
