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
    if (!profileForm.username) errors.username = "Tên người dùng là bắt buộc"
    if (!profileForm.email) errors.email = "Email là bắt buộc"
    if (profileForm.email && !/^\S+@\S+\.\S+$/.test(profileForm.email)) {
      errors.email = "Email không hợp lệ"
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
          Chỉnh sửa thông tin
        </MenuItem>
        <MenuItem onClick={handleSettingsDialogOpen}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Cài đặt
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); handleProfileMenuClose() }}>Logout</MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Tabs value={profileTabValue} onChange={handleProfileTabChange} aria-label="profile tabs">
            <Tab label="Thông tin cơ bản" id="profile-tab-0" />
            <Tab label="Chi tiết công việc" id="profile-tab-1" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {profileTabValue === 0 && (
              <Stack spacing={2}>
                <TextField 
                  label="Tên người dùng" 
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
                    label="Tên" 
                    name="firstName" 
                    value={profileForm.firstName} 
                    onChange={handleFormChange} 
                    fullWidth 
                  />
                  <TextField 
                    label="Họ" 
                    name="lastName" 
                    value={profileForm.lastName} 
                    onChange={handleFormChange} 
                    fullWidth 
                  />
                </Stack>
                <TextField 
                  label="Giới thiệu" 
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
                  label="Chức vụ chính" 
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
                  label="Số điện thoại" 
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
          <Button onClick={handleProfileDialogClose}>Hủy</Button>
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
        <DialogTitle>Cài đặt</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Cài đặt giao diện</Typography>
            
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
                  <Typography>Chế độ sáng</Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Brightness4 />
                  <Typography>Chế độ tối</Typography>
                </Stack>
              )}
            />
            
            <FormControl fullWidth>
              <InputLabel id="primary-color-label">Màu chủ đạo</InputLabel>
              <Select
                labelId="primary-color-label"
                name="primaryColor"
                value={themeSettings.primaryColor}
                label="Màu chủ đạo"
                onChange={handleThemeChange}
                startAdornment={<ColorLens style={{ color: themeSettings.primaryColor, marginRight: 8 }} />}
              >
                <MenuItem value="#1a56db">Xanh dương</MenuItem>
                <MenuItem value="#10b981">Xanh lá</MenuItem>
                <MenuItem value="#ef4444">Đỏ</MenuItem>
                <MenuItem value="#f59e0b">Vàng</MenuItem>
                <MenuItem value="#8b5cf6">Tím</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="font-size-label">Kích thước chữ</InputLabel>
              <Select
                labelId="font-size-label"
                name="fontSize"
                value={themeSettings.fontSize}
                label="Kích thước chữ"
                onChange={handleThemeChange}
              >
                <MenuItem value="small">Nhỏ</MenuItem>
                <MenuItem value="medium">Trung bình</MenuItem>
                <MenuItem value="large">Lớn</MenuItem>
              </Select>
            </FormControl>
            
            <Divider />
            
            <Typography variant="h6" gutterBottom>Thiết lập thông báo</Typography>
            
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
              label="Bật thông báo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsDialogClose}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleThemeSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AppHeader
