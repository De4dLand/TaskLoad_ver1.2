// This file is kept for backward compatibility
// The main routing configuration has been moved to App.jsx

// Pages
import LoginPage from "../components/features/auth/pages/LoginPage"
import RegisterPage from "../components/features/auth/pages/RegisterPage"
import ForgotPasswordPage from "../components/features/auth/pages/ForgotPasswordPage"
import { DashboardPage } from "../components/features/dashboard/pages"
import WorkspacePage from "../components/features/dashboard/pages/WorkspacePage"
import { TaskListPage, TaskDetailPage } from "../components/features/tasks/pages"
import { ChatbotPage } from "../components/features/Chatbot/pages"

import LandingPage from "../pages/LandingPage"
import NotFoundPage from "../pages/NotFoundPage"

// Export route configurations for reference
const routes = {
  // Public routes
  public: [
    {
      path: "/",
      element: LandingPage,
    },
    {
      path: "/login",
      element: LoginPage,
    },
    {
      path: "/register",
      element: RegisterPage,
    },
    {
      path: "/forgot-password",
      element: ForgotPasswordPage,
    },
  ],
  
  // Protected routes
  protected: [
    {
      path: "/dashboard",
      element: DashboardPage,
    },
    {
      path: "/workspace",
      element: WorkspacePage,
    },
    {
      path: "/chatbot",
      element: ChatbotPage,
    },
    {
      path: "/tasks",
      element: TaskListPage,
    },
    {
      path: "/tasks/:id",
      element: TaskDetailPage,
    },
  ],
  
  // Not found route
  notFound: {
    path: "*",
    element: NotFoundPage,
  },
}

export default routes
