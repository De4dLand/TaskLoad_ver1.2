import { Drawer, Typography, List, ListItem, ListItemIcon, Divider, Tooltip } from "@mui/material"
import { Dashboard, Assignment, People, DateRange, Settings, WorkOutline } from "@mui/icons-material"
import { Link } from "react-router-dom"
import styles from "./MainLayout.module.css"

const AppSidebar = ({user}) => {
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Workspace", icon: <WorkOutline />, path: "/workspace" },
    { text: "Tasks", icon: <Assignment />, path: "/tasks" },
    { text: "Teams", icon: <People />, path: "/teams" },
    { text: "Calendar", icon: <DateRange />, path: "/calendar" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ]

  return (
    <Drawer
      variant="permanent"
      className={styles.drawer}
      classes={{ paper: styles.drawerPaper }}
      sx={{
        '& .MuiDrawer-paper': {
          top: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      {/* <Typography>
        Hello, {user.username}
      </Typography> */}
      <div className={styles.toolbar} />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} component={Link} to={item.path} className={styles.listItem}>
            <Tooltip title={item.text} placement="right">
              <ListItemIcon>{item.icon}</ListItemIcon>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default AppSidebar
