"use client"

import { createContext, useState, useEffect, useCallback } from "react"
import * as authService from "../components/features/auth/services/authService"
import { useNavigate } from "react-router-dom"

// Create the authentication context
export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // State for user data, loading status, and error messages
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Function to check if user is authenticated on initialization
  const initializeAuth = useCallback(async () => {
    setLoading(true)
    try {
      // First check auth status cookie
      const cookies = document.cookie.split(";")
      const hasAuthCookie = cookies.some((cookie) => cookie.trim().startsWith("authStatus=true"))

      if (hasAuthCookie) {
        // Get user data if cookie suggests authentication
        setUser(await authService.getCurrentUser())
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Authentication initialization error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize auth state on component mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    try {
      const success = await authService.refreshToken()

      if (success) {
        setUser(await authService.getCurrentUser())
        return true
      }
      return false
    } catch (error) {
      console.error("Token refresh error:", error)
      setUser(null)
      return false
    }
  }, [])

  // Set up token refresh interval
  useEffect(() => {
    // Only set up refreshing if user is authenticated
    if (!user) return

    const refreshInterval = setInterval(refreshToken, 15 * 60 * 1000) // Check every 15 minutes

    return () => clearInterval(refreshInterval)
  }, [user, refreshToken])

  // Login function
  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      // Call service and update context
      const userData = await authService.login(email, password)
      setUser(userData)
      return userData
    } catch (error) {
      setError(error.response?.data?.message || "Login failed")
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (email, password, otherData = {}) => {
    setLoading(true)
    setError(null)
    try {
      // Call service and update context
      const userData = await authService.register({ email, password, ...otherData })
      setUser(userData)
      return userData
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed")
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      // Ensure navigate happens after state update
      setTimeout(() => navigate("/"), 0)
    }
  }

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
