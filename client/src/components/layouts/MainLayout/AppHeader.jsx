import { AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Divider } from "@mui/material"
import { Menu as MenuIcon, Notifications, AccountCircle } from "@mui/icons-material"
import styles from "./MainLayout.module.css"
import { useState, useEffect } from "react"
import useAuth from "../../../hooks/useAuth"

const AppHeader = () => {
  const { user, updateProfile, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ username: "", email: "", firstName: "", lastName: "" })

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || ""
      })
    }
  }, [user])

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget)
  const handleProfileMenuClose = () => setAnchorEl(null)
  const handleProfileDialogOpen = () => { setProfileDialogOpen(true); handleProfileMenuClose() }
  const handleProfileDialogClose = () => setProfileDialogOpen(false)
  const handleFormChange = (e) => { const { name, value } = e.target; setProfileForm(prev => ({ ...prev, [name]: value })) }
  const handleProfileSubmit = async () => { try { await updateProfile(profileForm); handleProfileDialogClose() } catch (err) { console.error("Profile update failed", err) } }

  return (
    <>
      <AppBar position="fixed" className={styles.appBar}>
        <Toolbar>
          <IconButton color="inherit" edge="start" className={styles.menuButton}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap className={styles.title}>
            TaskLoad
          </Typography>
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
        <MenuItem disabled>{user?.username}</MenuItem>
        <MenuItem disabled>{user?.email}</MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileDialogOpen}>Edit Profile</MenuItem>
        <MenuItem onClick={() => { logout(); handleProfileMenuClose() }}>Logout</MenuItem>
      </Menu>

      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" name="username" value={profileForm.username} onChange={handleFormChange} fullWidth />
            <TextField label="Email" name="email" value={profileForm.email} onChange={handleFormChange} fullWidth />
            <TextField label="First Name" name="firstName" value={profileForm.firstName} onChange={handleFormChange} fullWidth />
            <TextField label="Last Name" name="lastName" value={profileForm.lastName} onChange={handleFormChange} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleProfileSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AppHeader
