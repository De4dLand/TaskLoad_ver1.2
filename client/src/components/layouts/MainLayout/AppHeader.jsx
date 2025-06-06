import React, { useState, useEffect } from "react";
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Badge, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Stack, 
  Divider, 
  Switch, 
  FormControlLabel, 
  Select, 
  FormControl, 
  InputLabel, 
  Box, 
  Tabs, 
  Tab, 
  Avatar, 
  FormHelperText, 
  CircularProgress, 
  useMediaQuery, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  ListItemSecondaryAction, 
  IconButton as MuiIconButton, 
  Tooltip, 
  ButtonGroup 
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  AccountCircle, 
  Settings, 
  Brightness4, 
  Brightness7, 
  ColorLens, 
  Person, 
  CheckCircle, 
  MoreVert, 
  MarkEmailRead, 
  Close 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import useAuth from "../../../hooks/useAuth";
import useTheme from "../../../hooks/useTheme";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../features/dashboard/services/dashboardService";
import { updateUserProfile } from "../../../services/userService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";

const AppHeader = () => {
  const { user, logout } = useAuth();
  const { themeSettings, setThemeSettings } = useTheme();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  // Tab state for profile dialog
  const [profileTabValue, setProfileTabValue] = useState(0);
  
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
  });
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchUserNotifications();
      
      // Set up polling for new notifications (every 30 seconds)
      const interval = setInterval(fetchUserNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
      });
    }
  }, [user]);
  
  // Menu handlers
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  
  const handleNotificationsOpen = (e) => setNotificationsAnchorEl(e.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);
  
  const handleNotificationMenuOpen = (event, notification) => {
    setSelectedNotification(notification);
    setNotificationMenuAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuClose = () => setNotificationMenuAnchorEl(null);

  // Fetch user notifications
  const fetchUserNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications(notificationPage);
      setNotifications(prev => [...prev, ...(data.notifications||[]) ]);
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    // Navigate based on notification type
    if (notification.type === 'task') {
      navigate(`/tasks/${notification.relatedId}`);
    } else if (notification.type === 'project') {
      navigate(`/projects/${notification.relatedId}`);
    }
    handleNotificationsClose();
  };

  // Dialog handlers
  const handleProfileDialogOpen = () => {
    setProfileDialogOpen(true);
    handleProfileMenuClose();
  };

  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
  };

  const handleSettingsDialogOpen = () => {
    setSettingsDialogOpen(true);
    handleProfileMenuClose();
  };

  const handleSettingsDialogClose = () => {
    setSettingsDialogOpen(false);
  };

  // Tab change handler
  const handleProfileTabChange = (event, newValue) => {
    setProfileTabValue(newValue);
  };

  // Handle profile form submission
  const handleProfileSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const errors = {};
      if (!profileForm.firstName) errors.firstName = 'Vui lòng nhập tên';
      if (!profileForm.lastName) errors.lastName = 'Vui lòng nhập họ';
      if (!profileForm.email) {
        errors.email = 'Vui lòng nhập email';
      } else if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) {
        errors.email = 'Email không hợp lệ';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      // Prepare profile data for submission
      const profileData = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber || undefined,
        bio: profileForm.bio || undefined,
        jobTitle: profileForm.jobTitle || undefined,
        department: profileForm.department || undefined,
      };
      
      // Call the update profile service
      const updatedUser = await updateUserProfile(profileData, user._id);
      
      // Update the auth context with the new user data
      if (updatedUser) {
        // You might want to update the user context here if you have one
        // For example: updateUser(updatedUser);
        
        // Close the dialog on success
        handleProfileDialogClose();
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle API validation errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        // Show a generic error message
        setFormErrors({ submit: 'Có lỗi xảy ra khi cập nhật thông tin' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Theme change handler
  const handleThemeChange = (event) => {
    setThemeSettings({
      ...themeSettings,
      [event.target.name]: event.target.value
    });
  };

  // Toggle drawer
  const toggleDrawer = () => {
    // Implementation depends on your drawer state management
    console.log('Toggle drawer');
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TaskLoad
          </Typography>
          
          {/* Notification and User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notification Icon */}
            <Tooltip title="Thông báo">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Menu */}
            <Tooltip title="Tài khoản">
              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
                aria-controls={anchorEl ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
              >
                {user?.avatar ? (
                  <Avatar 
                    src={user.avatar} 
                    alt={user.username}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Notification Menu */}
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              style: {
                width: 400,
                maxHeight: 500,
                overflow: 'auto',
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Thông báo
              </Typography>
              <ButtonGroup size="small" variant="text">
                <Button 
                  onClick={handleMarkAllAsRead} 
                  disabled={unreadCount === 0 || isMarkingAll}
                  startIcon={<MarkEmailRead fontSize="small" />}
                >
                  Đánh dấu đã đọc
                </Button>
                <Button 
                  onClick={handleNotificationsClose}
                  startIcon={<Close fontSize="small" />}
                >
                  Đóng  
                </Button>
              </ButtonGroup>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Không có thông báo
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {notifications.map((notification) => (
                  <ListItem 
                    key={notification._id} 
                    button 
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      borderLeft: notification.read 
                        ? '3px solid transparent' 
                        : `3px solid ${muiTheme.palette.primary.main}`,
                      bgcolor: notification.read ? 'background.paper' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={notification.sender?.avatar ? `${API_ENDPOINTS.AUTH.BASE}${notification.sender.avatar}` : undefined}
                        alt={notification.sender?.name}
                      >
                        {notification.sender?.name?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={notification.content}
                      secondary={formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      primaryTypographyProps={{
                        color: notification.read ? 'textSecondary' : 'textPrimary',
                        variant: 'body2',
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationMenuOpen(e, notification);
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {hasMore && (
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  size="small" 
                  onClick={() => setNotificationPage(p => p + 1)}
                  disabled={loading}
                >
                  Xem thêm
                </Button>
              </Box>
            )}
          </Menu>
          
          {/* Notification Actions Menu */}
          <Menu
            anchorEl={notificationMenuAnchorEl}
            open={Boolean(notificationMenuAnchorEl)}
            onClose={handleNotificationMenuClose}
            onClick={handleNotificationMenuClose}
          >
            {selectedNotification && !selectedNotification.read && (
              <MenuItem 
                onClick={() => handleMarkAsRead(selectedNotification._id)}
              >
                <ListItem>
                  <CheckCircle fontSize="small" />
                  <ListItemText primary="Đánh dấu đã đọc" />
                </ListItem>
              </MenuItem>
            )}
            <MenuItem>
              <ListItem>
                <NotificationsIcon fontSize="small" />
                <ListItemText primary="Cài đặt thông báo" />
              </ListItem>
            </MenuItem>
          </Menu>
          
          {/* User Menu */}
          <Menu
            id="user-menu"
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
            <MenuItem onClick={() => { logout(); handleProfileMenuClose(); }}>
              Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
        <DialogContent>
          <Tabs value={profileTabValue} onChange={handleProfileTabChange} sx={{ mb: 3 }}>
            <Tab label="Thông tin cơ bản" />
            <Tab label="Chi tiết công việc" />
          </Tabs>
          
          {profileTabValue === 0 ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Tên"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
                <TextField
                  fullWidth
                  label="Họ"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Stack>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                fullWidth
                label="Số điện thoại"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Giới thiệu bản thân"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
              />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Chức vụ"
                value={profileForm.jobTitle}
                onChange={(e) => setProfileForm({...profileForm, jobTitle: e.target.value})}
              />
              <TextField
                fullWidth
                label="Phòng ban"
                value={profileForm.department}
                onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleProfileDialogClose}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleProfileSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={handleSettingsDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Cài đặt</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Cài đặt giao diện</Typography>
            
            <FormControl fullWidth>
              <InputLabel id="theme-mode-label">Chế độ giao diện</InputLabel>
              <Select
                labelId="theme-mode-label"
                name="mode"
                value={themeSettings.mode}
                label="Chế độ giao diện"
                onChange={handleThemeChange}
                startAdornment={
                  themeSettings.mode === 'dark' ? 
                  <Brightness7 sx={{ color: 'text.primary', mr: 1 }} /> : 
                  <Brightness4 sx={{ color: 'text.primary', mr: 1 }} />
                }
              >
                <MenuItem value="light">Sáng</MenuItem>
                <MenuItem value="dark">Tối</MenuItem>
                <MenuItem value="system">Theo hệ thống</MenuItem>
              </Select>
            </FormControl>
            
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
                    target: { 
                      name: 'notifications', 
                      value: e.target.checked 
                    }
                  })}
                />
              }
              label="Bật thông báo"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={themeSettings.sound}
                  onChange={(e) => handleThemeChange({
                    target: { 
                      name: 'sound', 
                      value: e.target.checked 
                    }
                  })}
                />
              }
              label="Âm thanh thông báo"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={themeSettings.emailNotifications}
                  onChange={(e) => handleThemeChange({
                    target: { 
                      name: 'emailNotifications', 
                      value: e.target.checked 
                    }
                  })}
                />
              }
              label="Thông báo qua email"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleSettingsDialogClose}>Hủy</Button>
          <Button 
            variant="contained" 
            // onClick={handleSettingsSubmit}
            disabled={isSubmitting}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppHeader;
