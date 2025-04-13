import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to attach the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If the error is 401 and we haven't attempted to retry the request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        const response = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = response.data

        // Update tokens in localStorage
        localStorage.setItem("accessToken", token)
        localStorage.setItem("refreshToken", newRefreshToken)

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axios(originalRequest)
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
