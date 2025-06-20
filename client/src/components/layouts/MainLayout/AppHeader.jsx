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
import { updateUserProfile, uploadAvatar, getUserProfile } from "../../../services/userService";
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
    phoneNumber: "",
    profileImage: ""
  });
  // Avatar states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

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

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const userData = await getUserProfile(user._id);

      if (userData) {
        setProfileForm({
          username: userData.username || "",
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          bio: userData.bio || "",
          jobTitle: userData.jobTitle || "",
          department: userData.department || "",
          phoneNumber: userData.phoneNumber || "",
          profileImage: userData.profileImage || ""
        });

        if (userData.profileImage) {
          setAvatarPreview(userData.profileImage);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data from user
  useEffect(() => {
    fetchUserProfile();
  }, [user?._id]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return null;

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      // Upload the avatar file
      const response = await uploadAvatar(formData, user?._id);

      if (response?.avatarUrl) {
        // Update local state
        setProfileForm(prev => ({
          ...prev,
          profileImage: response.avatarUrl
        }));

        setAvatarPreview(response.avatarUrl);
        return response.avatarUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

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
      setNotifications(prev => [...prev, ...(data.notifications || [])]);
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
    setFormErrors({});
    // Reset form to current user data when closing
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
        phoneNumber: user.phoneNumber || "",
        profileImage: user.profileImage || ""
      });
      setAvatarPreview(user.profileImage || "");
    }
    setAvatarFile(null);
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
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Basic validation
      const errors = {};
      if (!profileForm.firstName.trim()) errors.firstName = 'Please enter your first name';
      if (!profileForm.lastName.trim()) errors.lastName = 'Please enter your last name';
      if (!profileForm.email.trim()) {
        errors.email = 'Please enter your email';
      } else if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      // Prepare profile data
      const profileData = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber?.trim() || '',
        bio: profileForm.bio?.trim() || '',
        jobTitle: profileForm.jobTitle?.trim() || '',
        department: profileForm.department?.trim() || ''
      };

      // First upload avatar if a new one was selected
      if (avatarFile) {
        try {
          const avatarUrl = await handleAvatarUpload();
          if (avatarUrl) {
            profileData.profileImage = avatarUrl;
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          setFormErrors({
            submit: 'Failed to upload profile image. Please try again.'
          });
          return;
        }
      }

      // Update the profile
      await updateUserProfile(profileData, user?._id);

      // Refresh user data
      await fetchUserProfile();

      // Close the dialog
      handleProfileDialogClose();

      // Reset avatar file state
      setAvatarFile(null);

      // Show success message (you can replace this with a toast)
      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      setFormErrors({
        submit: error.response?.data?.message || 'An error occurred while updating your profile. Please try again.'
      });
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
                    src={user?.profileImage}
                    alt={user?.username}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    onClick={() => setProfileDialogOpen(true)}
                  >
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </Avatar>
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
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-avatar-upload"
              type="file"
              onChange={handleAvatarChange}
            />
            <Box sx={{ position: 'relative', mb: 2 }}>
              <label htmlFor="profile-avatar-upload">
                <Avatar
                  src={avatarPreview || user?.profileImage}
                  alt={user?.username}
                  sx={{
                    width: 120,
                    height: 120,
                    cursor: 'pointer',
                    transition: 'opacity 0.3s',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </label>
              {avatarPreview && (
                <IconButton
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview('');
                  }}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer' }}>
              Ảnh đại diện
            </Typography>
            {loading && (
              <CircularProgress size={24} sx={{ mt: 1 }} />
            )}
          </Box>

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
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
                <TextField
                  fullWidth
                  label="Họ"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Stack>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                fullWidth
                label="Số điện thoại"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Giới thiệu bản thân"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Chức vụ"
                value={profileForm.jobTitle}
                onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
              />
              <TextField
                fullWidth
                label="Phòng ban"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
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
