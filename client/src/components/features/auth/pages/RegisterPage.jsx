"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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
} from "@mui/material"
import { Visibility, VisibilityOff, Email } from "@mui/icons-material"
import { register } from "../services/authService"
import styles from "./RegisterPage.module.css"
import DiamondIcon from "@mui/icons-material/Diamond"
import GoogleIcon from "@mui/icons-material/Google"
import AppleIcon from "@mui/icons-material/Apple"

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    const newValue = name === "agreeToTerms" ? checked : value

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
  }

  const validateForm = () => {
    const newErrors = {}

    // Username validation
    if (!formData.username) {
      newErrors.username = "Tên Người Dùng là Bắt buộc"
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên Người Dùng phải có ít nhất 3 ký tự"
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Tên Người Dùng chỉ có thể chứa chữ, số và dấu gạch dưới"
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email là Bắt buộc"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Vui lòng nhập một địa chỉ email hợp lệ."
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Mật Khẩu là Bắt buộc"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật Khẩu phải có ít nhất 6 ký tự"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận Mật Khẩu là Bắt buộc"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật Khẩu và Xác nhận Mật Khẩu không khớp"
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = " Bạn phải đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật"
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

      // Call the register service
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })

      // Redirect to dashboard on success
      navigate("/dashboard")
    } catch (error) {
      console.error("Registration failed:", error)

      // Handle validation error array
      if (error.response?.data?.errors) {
        const fieldErrors = {}
        error.response.data.errors.forEach((err) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      } else if (error.response?.data?.message) {
        const msg = error.response.data.message
        const lower = msg.toLowerCase()
        if (lower.includes("email")) {
          setErrors((prev) => ({ ...prev, email: msg }))
        } else if (lower.includes("username") || error.usernameError) {
          setErrors((prev) => ({ ...prev, username: error.usernameError || msg }))
        } else {
          setErrors((prev) => ({ ...prev, form: msg }))
        }
      } else {
        setErrors((prev) => ({ ...prev, form: "Registration failed. Please try again." }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <Container component="main" maxWidth="sm" className={styles.container}>
      <Paper elevation={0} className={styles.paper}>
        <Box className={styles.logoContainer}>
          <DiamondIcon className={styles.logo} />
        </Box>

        <Typography component="h1" variant="h4" className={styles.title}>
          Tạo Tài Khoản
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className={styles.form}>
          <Box className={styles.formGroup}>
            <Typography variant="subtitle1" className={styles.label}>
              Tên Người Dùng
            </Typography>
            <TextField
              fullWidth
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              placeholder="Nhập Tên Người Dùng"
              variant="outlined"
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box className={styles.usernameIcon}>@</Box>
                  </InputAdornment>
                ),
              }}
            />
            {errors.username && (
              <FormHelperText error className={styles.errorText}>
                {errors.username}
              </FormHelperText>
            )}
          </Box>

          <Box className={styles.formGroup}>
            <Typography variant="subtitle1" className={styles.label}>
              Địa chỉ Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              placeholder="Nhập Địa chỉ Email"
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
              Mật Khẩu
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              placeholder="Nhập Mật Khẩu"
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

          <Box className={styles.formGroup}>
            <Typography variant="subtitle1" className={styles.label}>
                Xác nhận Mật Khẩu
            </Typography>
            <TextField
              fullWidth
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              placeholder="Xác nhận Mật Khẩu"
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
                    <IconButton
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                      className={styles.visibilityIcon}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {errors.confirmPassword && (
              <FormHelperText error className={styles.errorText}>
                {errors.confirmPassword}
              </FormHelperText>
            )}
          </Box>

          <Box className={styles.termsContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
              }
              label={
                <Typography variant="body2" className={styles.termsText}>
                  Tôi đồng ý với{" "}
                  <Link to="/terms" className={styles.termsLink}>
                    Điều khoản Dịch vụ
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className={styles.termsLink}>
                    Chính sách Bảo mật
                  </Link>
                </Typography>
              }
            />
            {errors.agreeToTerms && (
              <FormHelperText error className={styles.errorText}>
                {errors.agreeToTerms}
              </FormHelperText>
            )}
          </Box>

          {errors.form && (
            <Typography variant="body2" color="error" align="center" className={styles.formError}>
              {errors.form}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "Đang Tạo Tài Khoản..." : "Tạo Tài Khoản"}
          </Button>

          <Box className={styles.socialLoginContainer}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              className={styles.socialButton}
              onClick={() => console.log("Google sign-in")}
            ></Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AppleIcon />}
              className={styles.socialButton}
              onClick={() => console.log("Apple sign-in")}
            ></Button>
          </Box>

          <Box className={styles.loginLinkContainer}>
            <Typography variant="body2" className={styles.loginText}>
              Bạn đã có tài khoản?{" "}
              <Link to="/login" className={styles.loginLink}>
                Đăng nhập
              </Link>
            </Typography>
          </Box>

          <Box className={styles.footerContainer}>
            <Link to="/privacy" className={styles.privacyLink}>
              Chính sách Bảo mật
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default RegisterPage
