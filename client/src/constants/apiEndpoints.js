export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    CURRENT_USER: "/auth/me",
  },
  TASKS: {
    BASE: "/tasks",
    STATS: "/tasks/stats",
    RECENT: "/tasks/recent",
    UPCOMING: "/tasks/upcoming",
    DATE_RANGE: "/tasks/date-range",
    STATUS: (id) => `/tasks/${id}/status`,
  },
  DASHBOARD: {
    ACTIVITY: "/dashboard/activity",
  },
  USERS: {
    BASE: "/users",
  },
  PROJECTS: {
    BASE: "/projects",
    TASKS: (id) => `/projects/${id}/tasks`,
  },
  TEAMS: {
    BASE: "/teams",
  },
}
