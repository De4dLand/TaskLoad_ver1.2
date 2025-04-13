"use client"

import { createContext, useState, useEffect } from "react"
import * as authService from "../services/authService"
import React from "react"
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const userData = authService.getUser()
      setUser(userData)
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const userData = await authService.login(email, password)
    setUser(userData)
    return userData
  }

  const register = async (userData) => {
    const user = await authService.register(userData)
    setUser(user)
    return user
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
