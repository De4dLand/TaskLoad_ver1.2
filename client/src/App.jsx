import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import CssBaseline from "@mui/material/CssBaseline"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import routes from "./router"
import React from "react"
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </LocalizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
