export const formatDate = (date, options = {}) => {
  if (!date) return ""

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  const mergedOptions = { ...defaultOptions, ...options }

  return new Date(date).toLocaleDateString("en-US", mergedOptions)
}

export const formatDateTime = (date, options = {}) => {
  if (!date) return ""

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }

  const mergedOptions = { ...defaultOptions, ...options }

  return new Date(date).toLocaleDateString("en-US", mergedOptions)
}

export const truncateText = (text, maxLength = 100) => {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}
