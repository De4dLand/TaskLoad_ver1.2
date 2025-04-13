import api from "../../../../services/api"

export const getTasks = async (params = {}) => {
  const response = await api.get("/api/v1/tasks", { params })
  return response.data
}

export const getTaskById = async (id) => {
  const response = await api.get(`/api/v1/tasks/${id}`)
  return response.data
}

export const createTask = async (taskData) => {
  const response = await api.post("/api/v1/tasks", taskData)
  return response.data
}

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/api/v1/tasks/${id}`, taskData)
  return response.data
}

export const deleteTask = async (id) => {
  const response = await api.delete(`/api/v1/tasks/${id}`)
  return response.data
}

export const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`/api/v1/tasks/${id}/status`, { status })
  return response.data
}
