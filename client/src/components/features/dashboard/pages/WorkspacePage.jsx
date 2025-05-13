import React from 'react';
import { Box, Container } from '@mui/material';
import Workspace from '../components/Workspace/Workspace';
import MainLayout from '../../../layouts/MainLayout';

const WorkspacePage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Workspace />
    </Container>
  );
};

export default WorkspacePage;