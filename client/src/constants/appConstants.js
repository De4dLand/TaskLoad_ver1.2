export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  COMPLETED: "completed",
}

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.TODO]: "To Do",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.REVIEW]: "Review",
  [TASK_STATUS.COMPLETED]: "Completed",
}

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
}

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: "Low",
  [TASK_PRIORITY.MEDIUM]: "Medium",
  [TASK_PRIORITY.HIGH]: "High",
}

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  TASK_DETAIL: (id) => `/tasks/${id}`,
  TEAMS: "/teams",
  TEAM_DETAIL: (id) => `/teams/${id}`,
  SETTINGS: "/settings",
}
