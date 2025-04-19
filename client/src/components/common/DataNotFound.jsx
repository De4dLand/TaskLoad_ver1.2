import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const DataNotFound = ({ message }) => {
  const navigate = useNavigate()
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h4" gutterBottom>
        {message || 'Data not found'}
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}
        sx={{ mt: 2 }}>
        Go to Home
      </Button>
    </Box>
  )
}

export default DataNotFound
