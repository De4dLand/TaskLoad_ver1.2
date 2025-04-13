import { AppBar, Toolbar, Typography, IconButton, Badge } from "@mui/material"
import { Menu as MenuIcon, Notifications, AccountCircle } from "@mui/icons-material"
import styles from "./MainLayout.module.css"

const AppHeader = () => {
  return (
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
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default AppHeader
