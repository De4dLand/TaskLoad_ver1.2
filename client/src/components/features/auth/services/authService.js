import api from "../../../../services/api"

export const register = async (userData) => {
  try {
    const response = await api.post("/api/v1/auth/register", userData)

    // Store tokens in local storage
    if (response.data.token) {
      localStorage.setItem("accessToken", response.data.token)
    }

    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken)
    }

    return response.data.user
  } catch (error) {
    console.error("Registration error:", error)

    // Handle specific username errors
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message.toLowerCase()
      if (errorMessage.includes("username already taken") || errorMessage.includes("duplicate username")) {
        error.usernameError = "This username is already taken. Please choose another one."
      }
    }

    throw error
  }
}

export const login = async (email, password, rememberMe = false) => {
  try {
    const response = await api.post("/api/v1/auth/login", { email, password, rememberMe })

    // Store tokens in local storage or session storage based on rememberMe
    const storage = rememberMe ? localStorage : sessionStorage

    if (response.data.token) {
      storage.setItem("accessToken", response.data.token)
      // Always keep a copy in localStorage for the API interceptor
      localStorage.setItem("accessToken", response.data.token)
    }

    if (response.data.refreshToken) {
      storage.setItem("refreshToken", response.data.refreshToken)
      // Always keep a copy in localStorage for the API interceptor
      localStorage.setItem("refreshToken", response.data.refreshToken)
    }

    return response.data.user
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export const logout = () => {
  // Clear tokens from both storages
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("refreshToken")
}

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/api/v1/auth/me")
    return response.data
  } catch (error) {
    console.error("Get current user error:", error)
    throw error
  }
}

export const isAuthenticated = () => {
  // Check both storages for tokens
  return !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"))
}

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/api/v1/auth/forgot-password", { email })
    return response.data
  } catch (error) {
    console.error("Forgot password error:", error)
    throw error
  }
}

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/api/v1/auth/reset-password/${token}`, { password })
    return response.data
  } catch (error) {
    console.error("Reset password error:", error)
    throw error
  }
}
