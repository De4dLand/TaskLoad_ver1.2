import api from "../../../../services/api"
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints"

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Registered user data
 */
export const register = async (userData) => {
  try {
    // Validate required fields based on User model
    const { username, email, password } = userData
    if (!username || !email || !password) {
      const err = new Error("Username, email, and password are required.")
      err.code = "VALIDATION_ERROR"
      throw err
    }

    // Format data to match backend expectations
    const formattedData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      firstName: userData.firstName || "",
      lastName: userData.lastName || ""
    }

    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, formattedData)

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

    // Handle specific validation errors
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message.toLowerCase()
      if (errorMessage.includes("username") && (errorMessage.includes("already") || errorMessage.includes("taken"))) {
        error.usernameError = "This username is already taken. Please choose another one."
      }
      if (errorMessage.includes("email") && (errorMessage.includes("already") || errorMessage.includes("exists"))) {
        error.emailError = "This email is already registered. Please use another email or try logging in."
      }
    }

    throw error
  }
}

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Whether to remember the user
 * @returns {Promise<Object>} - Logged in user data
 */
export const login = async (email, password, rememberMe = false) => {
  // Frontend validation
  if (!email || !password) {
    const err = new Error("Email and password are required.")
    err.code = "VALIDATION_ERROR"
    throw err
  }
  
  try {
    // Format data to match backend expectations
    const payload = { 
      email: email.trim().toLowerCase(), 
      password 
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload)

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
    
    // Provide user-friendly error messages
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message
      if (errorMessage.includes("credentials") || errorMessage.includes("password")) {
        throw new Error("Invalid email or password. Please try again.")
      } else {
        throw new Error(errorMessage)
      }
    }
    throw error
  }
}


/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await api.post(API_ENDPOINTS.AUTH.LOGOUT)
  } catch (error) {
    console.error("Logout error:", error)
    // Continue with local logout even if server request fails
  } finally {
    // Clear tokens from both storages
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    sessionStorage.removeItem("accessToken")
    sessionStorage.removeItem("refreshToken")
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} - Current user data
 */
/**
 * Get the current authenticated user
 * @returns {Promise<Object>} - Current user data
 */
export const getCurrentUser = async () => {
  try {
    // Check if user is authenticated first
    if (!isAuthenticated()) {
      throw new Error("User is not authenticated")
    }
    
    const response = await api.get(API_ENDPOINTS.AUTH.CURRENT_USER)
    return response.data
  } catch (error) {
    console.error("Get current user error:", error)
    // If 401 Unauthorized, clear tokens
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      sessionStorage.removeItem("accessToken")
      sessionStorage.removeItem("refreshToken")
    }
    throw error
  }
}

/**
 * Check if a user is authenticated
 * @returns {boolean} - Whether the user is authenticated
 */
export const isAuthenticated = () => {
  // Check both storages for tokens
  return !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"))
}

/**
 * Request a password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} - Response message
 */
export const forgotPassword = async (email) => {
  try {
    if (!email || !email.trim()) {
      throw new Error("Email is required")
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { 
      email: email.trim().toLowerCase() 
    })
    return response.data
  } catch (error) {
    console.error("Forgot password error:", error)
    throw error
  }
}

/**
 * Reset a user's password
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} - Response message
 */
export const resetPassword = async (token, password) => {
  try {
    // Validate inputs
    if (!token || !password) {
      throw new Error("Token and password are required")
    }
    
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long")
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { 
      token,
      password 
    })
    return response.data
  } catch (error) {
    console.error("Reset password error:", error)
    throw error
  }
}

/**
 * Refresh the authentication token
 * @returns {Promise<boolean>} - Whether the refresh was successful
 */
export const refreshToken = async () => {
  try {
    const storedToken = localStorage.getItem("refreshToken")
    if (!storedToken) {
      console.warn("No refresh token found in storage")
      return false
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { 
      refreshToken: storedToken 
    })
    
    const { token: newToken, refreshToken: newRefreshToken } = response.data
    
    if (newToken) {
      localStorage.setItem("accessToken", newToken)
      // Also update in sessionStorage if it exists there
      if (sessionStorage.getItem("accessToken")) {
        sessionStorage.setItem("accessToken", newToken)
      }
    }
    
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken)
      // Also update in sessionStorage if it exists there
      if (sessionStorage.getItem("refreshToken")) {
        sessionStorage.setItem("refreshToken", newRefreshToken)
      }
    }
    
    return true
  } catch (error) {
    console.error("Refresh token error:", error)
    // Clear tokens on refresh failure
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    sessionStorage.removeItem("accessToken")
    sessionStorage.removeItem("refreshToken")
    return false
  }
}

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put("/api/v1/auth/profile", profileData)
    return response.data
  } catch (error) {
    console.error("Update profile error:", error)
    throw error
  }
}
