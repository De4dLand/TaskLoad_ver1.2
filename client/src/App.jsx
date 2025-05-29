import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import CssBaseline from "@mui/material/CssBaseline"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import React from "react"

// Layouts
import MainLayout from "./components/layouts/MainLayout"
import AuthLayout from "./components/layouts/AuthLayout"

// Routes
import ProtectedRoute from "./router/ProtectedRoute"

// Pages
import LandingPage from "./pages/LandingPage"
import NotFoundPage from "./pages/NotFoundPage"
import LoginPage from "./components/features/auth/pages/LoginPage"
import RegisterPage from "./components/features/auth/pages/RegisterPage"
import ForgotPasswordPage from "./components/features/auth/pages/ForgotPasswordPage"
import { DashboardPage } from "./components/features/dashboard/pages"
import WorkspacePage from "./components/features/dashboard/pages/WorkspacePage"
import { TaskListPage, TaskDetailPage } from "./components/features/tasks/pages"
import { ChatbotPage } from "./components/features/Chatbot/pages"
import { ChatbotButton } from "./components/features/Chatbot"

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth routes with AuthLayout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
              
              {/* Protected routes with MainLayout */}
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />
                <Route path="/tasks" element={<TaskListPage />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
              </Route>
              
              {/* Not found route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ChatbotButton />
          </LocalizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
