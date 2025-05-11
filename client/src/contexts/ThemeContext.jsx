import { createContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import useAuth from '../hooks/useAuth'

// Create the theme context
export const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth()
  const [themeSettings, setThemeSettings] = useState({
    mode: 'dark',
    primaryColor: '#1a56db',
    fontSize: 'medium',
    notifications: true
  })

  // Load theme settings from user profile when available
  useEffect(() => {
    if (user?.settings?.theme) {
      setThemeSettings({
        mode: user.settings.theme.mode || 'dark',
        primaryColor: user.settings.theme.primaryColor || '#1a56db',
        fontSize: user.settings.theme.fontSize || 'medium',
        notifications: user.settings.theme.notifications !== false
      })
    }
  }, [user])

  // Create MUI theme based on settings
  const theme = useMemo(() => {
    // Font size scaling based on setting
    const fontSizeScales = {
      small: 0.9,
      medium: 1,
      large: 1.1
    }
    
    const fontScale = fontSizeScales[themeSettings.fontSize] || 1
    
    return createTheme({
      palette: {
        mode: themeSettings.mode,
        primary: {
          main: themeSettings.primaryColor,
        },
        secondary: {
          main: '#f50057',
        },
        background: {
          default: themeSettings.mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: themeSettings.mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: themeSettings.mode === 'dark' ? '#e0e0e0' : '#212121',
          secondary: themeSettings.mode === 'dark' ? '#aaaaaa' : '#757575',
        },
      },
      typography: {
        fontFamily: ['Roboto', 'Arial', 'sans-serif'].join(','),
        fontSize: 14 * fontScale,
        h1: { fontWeight: 500, fontSize: `${2.5 * fontScale}rem` },
        h2: { fontWeight: 500, fontSize: `${2 * fontScale}rem` },
        h3: { fontWeight: 500, fontSize: `${1.75 * fontScale}rem` },
        h4: { fontWeight: 500, fontSize: `${1.5 * fontScale}rem` },
        h5: { fontWeight: 500, fontSize: `${1.25 * fontScale}rem` },
        h6: { fontWeight: 500, fontSize: `${1 * fontScale}rem` },
        body1: { fontSize: `${1 * fontScale}rem` },
        body2: { fontSize: `${0.875 * fontScale}rem` },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    })
  }, [themeSettings])

  // Context value
  const value = {
    themeSettings,
    setThemeSettings,
  }

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export default ThemeContext