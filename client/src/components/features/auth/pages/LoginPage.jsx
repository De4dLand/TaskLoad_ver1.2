"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import useAuth from "../../../../hooks/useAuth"
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  FormHelperText,
  Container,
  Paper,
  Alert,
} from "@mui/material"
import { Visibility, VisibilityOff, Email } from "@mui/icons-material"
import styles from "./LoginPage.module.css"
import DiamondIcon from "@mui/icons-material/Diamond"
import GoogleIcon from "@mui/icons-material/Google"
import AppleIcon from "@mui/icons-material/Apple"

const LoginPage = () => {
  const auth = useAuth() // Initialize auth context
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/dashboard"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    const newValue = name === "rememberMe" ? checked : value

    setFormData({
      ...formData,
      [name]: newValue,
    })

    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }

    // Clear general login error when any field changes
    if (loginError) {
      setLoginError("")
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setErrors({})
      setLoginError("")
      await auth.login(formData.email, formData.password, formData.rememberMe)
    } catch (error) {
      console.error("Login failed:", error)
      // Handle validation error array
      if (error.response?.data?.errors) {
        const fieldErrors = {}
        error.response.data.errors.forEach(err => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      } else if (error.response?.data?.message) {
        const msg = error.response.data.message
        const lower = msg.toLowerCase()
        // Attach to email or password field
        if (lower.includes("email")) {
          setErrors(prev => ({ ...prev, email: msg }))
        } else {
          setErrors(prev => ({ ...prev, password: msg }))
        }
      } else {
        setLoginError(error.message || "Login failed. Please check your credentials and try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Redirect after successful login
  useEffect(() => {
    // Redirect after login once auth context has loaded and user is authenticated
    if (!auth.loading && auth.isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [auth.loading, auth.isAuthenticated, navigate, from])

  return (
    <Container component="main" maxWidth="sm" className={styles.container}>
      <Paper elevation={0} className={styles.paper}>
        <Box className={styles.logoContainer}>
          <DiamondIcon className={styles.logo} />
        </Box>

        <Typography component="h1" variant="h4" className={styles.title}>
          Welcome Back
        </Typography>

        {loginError && (
          <Alert severity="error" className={styles.alert}>
            {loginError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className={styles.form}>
          <Box className={styles.formGroup}>
            <Typography variant="subtitle1" className={styles.label}>
              Email Address
            </Typography>
            <TextField
              fullWidth
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              placeholder="Enter your email"
              variant="outlined"
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email className={styles.inputIcon} />
                  </InputAdornment>
                ),
              }}
            />
            {errors.email && (
              <FormHelperText error className={styles.errorText}>
                {errors.email}
              </FormHelperText>
            )}
          </Box>

          <Box className={styles.formGroup}>
            <Typography variant="subtitle1" className={styles.label}>
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              placeholder="Enter your password"
              variant="outlined"
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box className={styles.passwordIcon}></Box>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePasswordVisibility} edge="end" className={styles.visibilityIcon}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {errors.password && (
              <FormHelperText error className={styles.errorText}>
                {errors.password}
              </FormHelperText>
            )}
          </Box>

          <Box className={styles.optionsContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
              }
              label={
                <Typography variant="body2" className={styles.checkboxLabel}>
                  Remember me
                </Typography>
              }
            />
            <Link to="/forgot-password" className={styles.forgotPasswordLink}>
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          <Box className={styles.dividerContainer}>
            <div className={styles.divider}></div>
            <Typography variant="body2" className={styles.dividerText}>
              OR
            </Typography>
            <div className={styles.divider}></div>
          </Box>

          <Box className={styles.socialLoginContainer}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              className={styles.socialButton}
              onClick={() => console.log("Google sign-in")}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AppleIcon />}
              className={styles.socialButton}
              onClick={() => console.log("Apple sign-in")}
            >
              Sign in with Apple
            </Button>
          </Box>

          <Box className={styles.registerLinkContainer}>
            <Typography variant="body2" className={styles.registerText}>
              Don't have an account?{" "}
              <Link to="/register" className={styles.registerLink}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default LoginPage
