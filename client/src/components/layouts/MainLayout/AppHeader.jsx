import { AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Divider, Switch, FormControlLabel, Select, FormControl, InputLabel, Box, Tabs, Tab, Avatar, FormHelperText, CircularProgress, useMediaQuery } from "@mui/material"
import { Menu as MenuIcon, Notifications, AccountCircle, Settings, Brightness4, Brightness7, ColorLens, Person } from "@mui/icons-material"
import styles from "./MainLayout.module.css"
import { useState, useEffect } from "react"
import useAuth from "../../../hooks/useAuth"
import useTheme from "../../../hooks/useTheme"
import { useTheme as useMuiTheme } from "@mui/material/styles"
import { useNavigate } from "react-router-dom"

const AppHeader = () => {
  const { user, updateProfile, logout } = useAuth()
  const { themeSettings, setThemeSettings } = useTheme()
  const navigate = useNavigate()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null)
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  
  // Tab state for profile dialog
  const [profileTabValue, setProfileTabValue] = useState(0)
  
  // Form states
  const [profileForm, setProfileForm] = useState({ 
    username: "", 
    email: "", 
    firstName: "", 
    lastName: "", 
    bio: "",
    jobTitle: "",
    department: "",
    phoneNumber: ""
  })
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  
  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
        phoneNumber: user.phoneNumber || ""
      })
    }
  }, [user])
  
  // Menu handlers
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget)
  const handleProfileMenuClose = () => setAnchorEl(null)
  
  // Navigation handlers
  const handleWorkspaceClick = () => navigate('/workspace')
  
  // Dialog handlers
  const handleProfileDialogOpen = () => { 
    setProfileDialogOpen(true)
    setProfileTabValue(0)
    handleProfileMenuClose() 
  }
  const handleProfileDialogClose = () => setProfileDialogOpen(false)
  const handleSettingsDialogOpen = () => { 
    setSettingsDialogOpen(true)
    handleProfileMenuClose() 
  }
  const handleSettingsDialogClose = () => setSettingsDialogOpen(false)
  
  // Tab handlers
  const handleProfileTabChange = (event, newValue) => {
    setProfileTabValue(newValue)
  }
  
  // Form handlers
  const handleFormChange = (e) => { 
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const handleThemeChange = (e) => {
    const { name, value, checked } = e.target
    setThemeSettings(prev => ({
      ...prev,
      [name]: name === "notifications" ? checked : value
    }))
  }
  
  // Validate profile form
  const validateProfileForm = () => {
    const errors = {}
    if (!profileForm.username) errors.username = "Username is required"
    if (!profileForm.email) errors.email = "Email is required"
    if (profileForm.email && !/^\S+@\S+\.\S+$/.test(profileForm.email)) {
      errors.email = "Invalid email format"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Submit handlers
  const handleProfileSubmit = async () => { 
    if (!validateProfileForm()) return
    
    setIsSubmitting(true)
    try { 
      await updateProfile(profileForm)
      handleProfileDialogClose() 
    } catch (err) { 
      console.error("Profile update failed", err)
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleThemeSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Update both context and user profile in database
      await updateProfile({ 
        settings: { 
          theme: themeSettings 
        }
      })
      handleSettingsDialogClose()
    } catch (err) {
      console.error("Theme settings update failed", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AppBar position="fixed" className={styles.appBar}>
        <Toolbar className={styles.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            className={styles.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={styles.title}>
            TaskLoad
          </Typography>
          
          {/* Add Workspace Link */}
          <Button 
            color="inherit" 
            onClick={handleWorkspaceClick}
            className={styles.navButton}
          >
            Workspace
          </Button>
          
          <div className={styles.grow} />
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={handleProfileMenuOpen}>
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem disabled>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24 }}>
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </Avatar>
            <Typography variant="body2">{user?.username}</Typography>
          </Stack>
        </MenuItem>
        <MenuItem disabled>{user?.email}</MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileDialogOpen}>
          <Person fontSize="small" sx={{ mr: 1 }} />
          Edit Profile
        </MenuItem>
        <MenuItem onClick={handleSettingsDialogOpen}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); handleProfileMenuClose() }}>Logout</MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Tabs value={profileTabValue} onChange={handleProfileTabChange} aria-label="profile tabs">
            <Tab label="Basic Info" id="profile-tab-0" />
            <Tab label="Work Details" id="profile-tab-1" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {profileTabValue === 0 && (
              <Stack spacing={2}>
                <TextField 
                  label="Username" 
                  name="username" 
                  value={profileForm.username} 
                  onChange={handleFormChange} 
                  fullWidth 
                  required
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                />
                <TextField 
                  label="Email" 
                  name="email" 
                  type="email"
                  value={profileForm.email} 
                  onChange={handleFormChange} 
                  fullWidth 
                  required
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField 
                    label="First Name" 
                    name="firstName" 
                    value={profileForm.firstName} 
                    onChange={handleFormChange} 
                    fullWidth 
                  />
                  <TextField 
                    label="Last Name" 
                    name="lastName" 
                    value={profileForm.lastName} 
                    onChange={handleFormChange} 
                    fullWidth 
                  />
                </Stack>
                <TextField 
                  label="Bio" 
                  name="bio" 
                  value={profileForm.bio} 
                  onChange={handleFormChange} 
                  fullWidth 
                  multiline 
                  rows={3} 
                  placeholder="Tell us about yourself"
                />
              </Stack>
            )}
            {profileTabValue === 1 && (
              <Stack spacing={2}>
                <TextField 
                  label="Job Title" 
                  name="jobTitle" 
                  value={profileForm.jobTitle} 
                  onChange={handleFormChange} 
                  fullWidth 
                />
                <FormControl fullWidth>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={profileForm.department}
                    label="Department"
                    onChange={handleFormChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="engineering">Engineering</MenuItem>
                    <MenuItem value="design">Design</MenuItem>
                    <MenuItem value="product">Product</MenuItem>
                    <MenuItem value="marketing">Marketing</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="support">Support</MenuItem>
                    <MenuItem value="hr">Human Resources</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  label="Phone Number" 
                  name="phoneNumber" 
                  value={profileForm.phoneNumber} 
                  onChange={handleFormChange} 
                  fullWidth 
                />
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileDialogClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleProfileSubmit} 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={handleSettingsDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Theme Settings</Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={themeSettings.mode === "light"}
                  onChange={(e) => handleThemeChange({
                    target: { name: "mode", value: e.target.checked ? "light" : "dark" }
                  })}
                />
              }
              label={themeSettings.mode === "light" ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Brightness7 />
                  <Typography>Light Mode</Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Brightness4 />
                  <Typography>Dark Mode</Typography>
                </Stack>
              )}
            />
            
            <FormControl fullWidth>
              <InputLabel id="primary-color-label">Primary Color</InputLabel>
              <Select
                labelId="primary-color-label"
                name="primaryColor"
                value={themeSettings.primaryColor}
                label="Primary Color"
                onChange={handleThemeChange}
                startAdornment={<ColorLens style={{ color: themeSettings.primaryColor, marginRight: 8 }} />}
              >
                <MenuItem value="#1a56db">Blue</MenuItem>
                <MenuItem value="#10b981">Green</MenuItem>
                <MenuItem value="#ef4444">Red</MenuItem>
                <MenuItem value="#f59e0b">Amber</MenuItem>
                <MenuItem value="#8b5cf6">Purple</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="font-size-label">Font Size</InputLabel>
              <Select
                labelId="font-size-label"
                name="fontSize"
                value={themeSettings.fontSize}
                label="Font Size"
                onChange={handleThemeChange}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
            
            <Divider />
            
            <Typography variant="h6" gutterBottom>Notification Settings</Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={themeSettings.notifications}
                  onChange={(e) => handleThemeChange({
                    target: { name: "notifications", checked: e.target.checked }
                  })}
                  name="notifications"
                />
              }
              label="Enable Notifications"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsDialogClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleThemeSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AppHeader
