import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material"
import { Dashboard, Assignment, People, DateRange, Settings } from "@mui/icons-material"
import { Link } from "react-router-dom"
import styles from "./MainLayout.module.css"

const AppSidebar = () => {
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Tasks", icon: <Assignment />, path: "/tasks" },
    { text: "Teams", icon: <People />, path: "/teams" },
    { text: "Calendar", icon: <DateRange />, path: "/calendar" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ]

  return (
    <Drawer
      variant="permanent"
      className={styles.drawer}
      classes={{
        paper: styles.drawerPaper,
      }}
    >
      <div className={styles.toolbar} />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path} className={styles.listItem}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default AppSidebar
