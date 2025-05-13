import api from "../../../../services/api"

export const fetchDashboardData = async () => {
  try {
    // Fetch aggregated dashboard data for current user
    const response = await api.get("/api/v1/dashboard")
    return {
      tasks: response.data.tasks || [],
      projects: response.data.projects || [],
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

export const fetchTaskStats = async () => {
  try {
    const response = await api.get("/api/v1/tasks/stats")
    return response.data
  } catch (error) {
    console.error("Error fetching task statistics:", error)
    throw error
  }
}

export const fetchRecentActivity = async () => {
  try {
    const response = await api.get("/api/v1/dashboard/activity")
    return response.data
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    throw error
  }
}

// Create a new project
export const createProject = async (projectData) => {
  try {
    const response = await api.post("/api/v1/projects", projectData)
    return response.data
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post("/api/v1/tasks", taskData)
    return response.data
  } catch (error) {
    console.error("Error creating task:", error)
    throw error
  }
}

// Update a task
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/api/v1/tasks/${taskId}`, taskData)
    return response.data
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/api/v1/tasks/${taskId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

// Update a project
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/api/v1/projects/${projectId}`, projectData)
    return response.data
  } catch (error) {
    console.error("Error updating project:", error)
    throw error
  }
}

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/api/v1/projects/${projectId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error
  }
}

// Fetch user workspace data (tasks created by and assigned to the user)
export const fetchUserWorkspace = async (userId) => {
  try {
    const response = await api.get(`/api/v1/users/${userId}/workspace`)
    return response.data
  } catch (error) {
    console.error("Error fetching user workspace data:", error)
    throw error
  }
}

// Add a member to a project
export const addProjectMember = async (projectId, userId, role = 'member') => {
  console.log("Adding project member:", projectId, userId, role)
  try {
    const response = await api.post(`/api/v1/projects/${projectId}/members`, { userId, role })
    return response.data
  } catch (error) {
    console.error("Error adding project member:", error)
    throw error
  }
}

// Search users by username or email
export const searchUsers = async (query) => {
  try {
    const response = await api.get("/api/v1/user/search", { params: { query } })
    return response.data
  } catch (error) {
    console.error("Error searching users:", error)
    throw error
  }
}
