import { Outlet } from "react-router-dom"
import { Box, Container } from "@mui/material"
import AppHeader from "./AppHeader"
import AppSidebar from "./AppSidebar"
import styles from "./MainLayout.module.css"

const MainLayout = () => {
  return (
    <Box className={styles.root}>
      <AppHeader />
      <Box className={styles.container}>
        <AppSidebar />
        <Box component="main" className={styles.main}>
          <Container maxWidth="lg" className={styles.content}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
