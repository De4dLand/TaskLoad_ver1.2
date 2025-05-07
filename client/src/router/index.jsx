import ProtectedRoute from "./ProtectedRoute"
import MainLayout from "../components/layouts/MainLayout"

// Pages
import LoginPage from "../components/features/auth/pages/LoginPage"
import RegisterPage from "../components/features/auth/pages/RegisterPage"
import ForgotPasswordPage from "../components/features/auth/pages/ForgotPasswordPage"
import { DashboardPage } from "../components/features/dashboard/pages"
import { TaskListPage, TaskDetailPage } from "../components/features/tasks/pages"

import LandingPage from "../pages/LandingPage"
import NotFoundPage from "../pages/NotFoundPage"

const routes = [
  // Public routes
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },

  // Protected routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },

  // Not found route
  {
    path: "*",
    element: <NotFoundPage />,
  },
]

export default routes
