const API_BASE = '/api/v1';

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
    CURRENT_USER: `${API_BASE}/auth/me`,
    UPDATE_PROFILE: `${API_BASE}/auth/me`,
  },

  // Task endpoints
  TASKS: {
    BASE: `${API_BASE}/tasks`,
    STATS: `${API_BASE}/tasks/stats`,
    RECENT: `${API_BASE}/tasks/recent`,
    UPCOMING: `${API_BASE}/tasks/upcoming`,
    DATE_RANGE: `${API_BASE}/tasks/date-range`,
    getById: (id) => `${API_BASE}/tasks/${id}`,
    updateStatus: (id) => `${API_BASE}/tasks/${id}/status`,
  },
  
  // Subtask endpoints
  SUBTASKS: {
    BASE: `${API_BASE}/subtasks`,
    getById: (id) => `${API_BASE}/subtasks/${id}`,
    getByTask: (taskId) => `${API_BASE}/tasks/${taskId}/subtasks`,
    reorder: (taskId) => `${API_BASE}/tasks/${taskId}/subtasks/reorder`,
  },

  // Project endpoints
  PROJECTS: {
    BASE: `${API_BASE}/projects`,
    getById: (id) => `${API_BASE}/projects/${id}`,
    getTasks: (id) => `${API_BASE}/projects/${id}/tasks`,
    addMember: (id) => `${API_BASE}/projects/${id}/members`,
    removeMember: (projectId, userId) => `${API_BASE}/projects/${projectId}/members/${userId}`,
    updateMemberRole: (projectId, userId) => `${API_BASE}/projects/${projectId}/members/${userId}/role`,
  },

  // Team endpoints
  TEAMS: {
    BASE: `${API_BASE}/teams`,
    getById: (id) => `${API_BASE}/teams/${id}`,
    getMembers: (id) => `${API_BASE}/teams/${id}/members`,
    addMember: (id) => `${API_BASE}/teams/${id}/members`,
    removeMember: (teamId, userId) => `${API_BASE}/teams/${teamId}/members/${userId}`,
    updateMemberRole: (teamId, userId) => `${API_BASE}/teams/${teamId}/members/${userId}/role`,
  },

  // Chat endpoints
  CHAT: {
    ROOMS: `${API_BASE}/chat`,
    createRoom: `${API_BASE}/chat`,
    getRoom: (roomId) => `${API_BASE}/chat/${roomId}`,
    getMessages: (roomId) => `${API_BASE}/chat/${roomId}/messages`,
    sendMessage: (roomId) => `${API_BASE}/chat/${roomId}/messages`,
    markAsRead: (roomId) => `${API_BASE}/chat/${roomId}/mark-read`,
  },

  // Notification endpoints
  NOTIFICATIONS: {
    BASE: `${API_BASE}/notifications`,
    UNREAD: `${API_BASE}/notifications/unread`,
    markAsRead: (id) => `${API_BASE}/notifications/${id}/read`,
    markAllAsRead: `${API_BASE}/notifications/mark-all-read`,
    getSettings: `${API_BASE}/notifications/settings`,
    updateSettings: `${API_BASE}/notifications/settings`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    BASE: `${API_BASE}/dashboard`,
    ACTIVITY: `${API_BASE}/dashboard/activity`,
    getUserDashboard: (userId) => `${API_BASE}/dashboard/user/${userId}`,
  },

  // User endpoints
  USERS: {
    BASE: `${API_BASE}/users`,
    getById: (id) => `${API_BASE}/users/${id}`,
    updateAvatar: (id) => `${API_BASE}/users/${id}/avatar`,
    changePassword: (id) => `${API_BASE}/users/${id}/password`,
    search: `${API_BASE}/users/search`,
  },

  // Time Tracking endpoints
  TIME_TRACKING: {
    BASE: `${API_BASE}/time-entries`,
    getById: (id) => `${API_BASE}/time-entries/${id}`,
    getByTask: (taskId) => `${API_BASE}/time-entries/task/${taskId}`,
    getByProject: (projectId) => `${API_BASE}/time-entries/project/${projectId}`,
    getByUser: (userId) => `${API_BASE}/time-entries/user/${userId}`,
    stop: (id) => `${API_BASE}/time-entries/${id}/stop`,
  },
};
