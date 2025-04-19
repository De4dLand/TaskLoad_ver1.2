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
