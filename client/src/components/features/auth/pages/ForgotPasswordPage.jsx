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
  //validate email
  const validateEmail = () => {
    if (!email) {
      setError("Email không được để trống")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Vui lòng nhập một địa chỉ email hợp lệ")
      return false
    }
    return true
  }
  //handle submit
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
          Quên Mật Khẩu
        </Typography>

        {success ? (
          <Box className={styles.successContainer}>
            <Alert severity="success" className={styles.successAlert}>
              Nếu có tài khoản với email này, chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn.
            </Alert>
            <Typography variant="body2" className={styles.instructionText}>
              Vui lòng kiểm tra hộp thư đến của bạn và theo dõi hướng dẫn để khôi phục mật khẩu. Nếu bạn không nhận được
              email trong vài phút, hãy kiểm tra thư mục spam.
            </Typography>
            <Button component={Link} to="/login" startIcon={<ArrowBack />} className={styles.backButton}>
              Quay lại đăng nhập
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            <Typography variant="body2" className={styles.instructionText}>
              Vui lòng nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến email của bạn.
            </Typography>

            {error && (
              <Alert severity="error" className={styles.alert}>
                {error}
              </Alert>
            )}

            <Box className={styles.formGroup}>
              <Typography variant="subtitle1" className={styles.label}>
                Email
              </Typography>
              <TextField
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                error={!!error}
                placeholder="Nhập email"
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
              {isSubmitting ? "Đang gửi..." : "Gửi hướng dẫn khôi phục mật khẩu"}
            </Button>

            <Box className={styles.loginLinkContainer}>
              <Link to="/login" className={styles.loginLink}>
                <ArrowBack fontSize="small" className={styles.backIcon} />
                  Quay lại đăng nhập
              </Link>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default ForgotPasswordPage
