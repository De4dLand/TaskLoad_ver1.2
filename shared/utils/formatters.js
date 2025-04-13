export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export const formatNumber = (number, options = {}) => {
  return new Intl.NumberFormat("en-US", options).format(number)
}

export const formatPercentage = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export const formatDuration = (minutes) => {
  if (!minutes) return "0m"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}m`
  }

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

export const truncateText = (text, maxLength = 100) => {
  if (!text) return ""
  if (text.length <= maxLength) return text

  return `${text.substring(0, maxLength)}...`
}

