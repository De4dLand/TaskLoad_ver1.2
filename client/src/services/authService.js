import api from "./api"
import { jwtDecode } from "jwt-decode"

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password })
    const { token, refreshToken } = response.data

    // Store tokens in local storage
    localStorage.setItem("accessToken", token)
    localStorage.setItem("refreshToken", refreshToken)

    // Extract user data from token
    const userData = jwtDecode(token)
    return userData
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed")
  }
}

export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData)
    const { token, refreshToken } = response.data

    // Store tokens in local storage
    localStorage.setItem("accessToken", token)
    localStorage.setItem("refreshToken", refreshToken)

    // Extract user data from token
    const user = jwtDecode(token)
    return user
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed")
  }
}

export const logout = () => {
  // Remove tokens from local storage
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}

export const getUser = () => {
  const token = localStorage.getItem("accessToken")
  if (!token) return null

  try {
    // Decode token to get user data
    const userData = jwtDecode(token)

    // Check if token is expired
    const currentTime = Date.now() / 1000
    if (userData.exp && userData.exp < currentTime) {
      // Token expired
      localStorage.removeItem("accessToken")
      return null
    }

    return userData
  } catch (error) {
    console.error("Failed to decode token:", error)
    return null
  }
}

export const isAuthenticated = () => {
  return getUser() !== null
}
