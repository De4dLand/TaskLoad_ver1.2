import { Container, Box, Paper } from "@mui/material"
import { Outlet } from "react-router-dom"
import styles from "./AuthLayout.module.css"

const AuthLayout = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box className={styles.container}>
        <Paper elevation={3} className={styles.paper}>
          <Outlet />
        </Paper>
      </Box>
    </Container>
  )
}

export default AuthLayout
