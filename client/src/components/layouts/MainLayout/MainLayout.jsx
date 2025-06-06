import { Outlet } from "react-router-dom"
import { Box, Container } from "@mui/material"
import AppHeader from "./AppHeader"
import AppSidebar from "./AppSidebar"
import { ChatbotButton } from "../../features/Chatbot"
import styles from "./MainLayout.module.css"

const MainLayout = () => {
  return (
    <Box className={styles.root}>
      <AppHeader />
      <Box className={styles.container}>
        <AppSidebar />
        <Box component="main" className={styles.main}>
          <Container maxWidth={false} className={styles.content}>
            <Box className={styles.contentWrapper}>
              <Outlet />
            </Box>
          </Container>
        </Box>
      </Box>
      {/* AI Assistant chatbot button */}
      <ChatbotButton />
    </Box>
  )
}

export default MainLayout
