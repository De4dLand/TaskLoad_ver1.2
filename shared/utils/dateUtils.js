import { format, isToday, isThisWeek, isThisMonth, addDays } from "date-fns"

export const formatDate = (date, formatString = "MMM d, yyyy") => {
  if (!date) return ""
  return format(new Date(date), formatString)
}

export const formatDateTime = (date) => {
  if (!date) return ""
  return format(new Date(date), "MMM d, yyyy h:mm a")
}

export const getRelativeTimeLabel = (date) => {
  if (!date) return ""

  const dateObj = new Date(date)

  if (isToday(dateObj)) {
    return "Today"
  }

  if (isToday(addDays(dateObj, -1))) {
    return "Yesterday"
  }

  if (isThisWeek(dateObj)) {
    return "This Week"
  }

  if (isThisMonth(dateObj)) {
    return "This Month"
  }

  return formatDate(date, "MMMM yyyy")
}

export const getDueStatusClass = (dueDate) => {
  if (!dueDate) return ""

  const today = new Date()
  const due = new Date(dueDate)

  if (due < today) {
    return "overdue"
  }

  const tomorrow = addDays(today, 1)
  if (due <= tomorrow) {
    return "due-soon"
  }

  const nextWeek = addDays(today, 7)
  if (due <= nextWeek) {
    return "upcoming"
  }

  return "future"
}

