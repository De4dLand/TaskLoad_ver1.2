"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  FormHelperText,
  Container,
  Paper,
  Alert,
} from "@mui/material"
import { Email, ArrowBack } from "@mui/icons-material"
import { forgotPassword } from "../services/authService"
import styles from "./ForgotPasswordPage.module.css"
import DiamondIcon from "@mui/icons-material/Diamond"

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setError("Email is required")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await forgotPassword(email)
      setSuccess(true)
    } catch (error) {
      console.error("Password reset request failed:", error)
      setError("Failed to process your request. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm" className={styles.container}>
      <Paper elevation={0} className={styles.paper}>
        <Box className={styles.logoContainer}>
          <DiamondIcon className={styles.logo} />
        </Box>

        <Typography component="h1" variant="h4" className={styles.title}>
          Reset Your Password
        </Typography>

        {success ? (
          <Box className={styles.successContainer}>
            <Alert severity="success" className={styles.successAlert}>
              If an account exists with this email, we've sent password reset instructions.
            </Alert>
            <Typography variant="body2" className={styles.instructionText}>
              Please check your email inbox and follow the instructions to reset your password. If you don't receive an
              email within a few minutes, check your spam folder.
            </Typography>
            <Button component={Link} to="/login" startIcon={<ArrowBack />} className={styles.backButton}>
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            <Typography variant="body2" className={styles.instructionText}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" className={styles.alert}>
                {error}
              </Alert>
            )}

            <Box className={styles.formGroup}>
              <Typography variant="subtitle1" className={styles.label}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                error={!!error}
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
              {error && (
                <FormHelperText error className={styles.errorText}>
                  {error}
                </FormHelperText>
              )}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "Sending..." : "Send Reset Instructions"}
            </Button>

            <Box className={styles.loginLinkContainer}>
              <Link to="/login" className={styles.loginLink}>
                <ArrowBack fontSize="small" className={styles.backIcon} />
                Back to Login
              </Link>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default ForgotPasswordPage
