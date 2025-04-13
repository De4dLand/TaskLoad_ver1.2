"use client"
import { Navigate, useLocation } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { CircularProgress, Box } from "@mui/material"

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    // Redirect to landing page with redirect back to the current page
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
