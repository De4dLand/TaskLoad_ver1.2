export const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isPasswordValid = (password) => {
  return password && password.length >= 6
}

export const validateRequiredField = (value, fieldName) => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `${fieldName} is required`
  }
  return ""
}

export const validateEmail = (email) => {
  if (!email) {
    return "Email is required"
  }
  if (!isEmail(email)) {
    return "Invalid email address"
  }
  return ""
}

export const validatePassword = (password) => {
  if (!password) {
    return "Password is required"
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters long"
  }
  return ""
}
