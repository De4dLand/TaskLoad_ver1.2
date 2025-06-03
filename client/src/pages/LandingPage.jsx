"use client"

import { useState, useEffect } from "react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Toolbar,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  CheckCircleOutline,
  Assignment,
  Dashboard,
  People,
  DateRange,
  Notifications,
} from "@mui/icons-material"
import DiamondIcon from "@mui/icons-material/Diamond"
import useAuth from "../hooks/useAuth"
import styles from "./LandingPage.module.css"

const LandingPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to dashboard when auth state is ready
  const { isAuthenticated, loading } = useAuth()
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard")
    }
  }, [loading, isAuthenticated, navigate])

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const features = [
    {
      icon: <Dashboard fontSize="large" className={styles.featureIcon} />,
      title: "Dashboard",
      description: "Tổng hợp công việc, dự án, các vấn đề của bạn tại cùng một nơi để quản lý",
    },
    {
      icon: <Assignment fontSize="large" className={styles.featureIcon} />,
      title: "Quản lý công việc",
      description: "Tạo, tổ chức và ưu tiên công việc dễ dàng. Theo dõi tiến trình và không bỏ lỡ hạn chót.",
    },
    {
      icon: <People fontSize="large" className={styles.featureIcon} />,
      title: "Tương tác với đội ngũ",
      description: "Làm việc cùng đội ngũ một cách hiệu quả. Giao phó công việc, chia sẻ cập nhật và theo dõi tiến trình cùng nhau.",
    },
    {
      icon: <DateRange fontSize="large" className={styles.featureIcon} />,
      title: "Tích hợp lịch",
      description: "Hiển thị lịch của bạn và quản lý thời gian một cách hiệu quả với lịch được tích hợp.",
    },
    {
      icon: <Notifications fontSize="large" className={styles.featureIcon} />,
      title: "Thông báo thông minh",
      description: "Theo dõi công việc của bạn với thông báo kịp thời và thông báo về các hạn chót quan trọng.",
    },
    {
      icon: <CheckCircleOutline fontSize="large" className={styles.featureIcon} />,
      title: "Theo dõi tiến trình",
      description: "Theo dõi tiến trình và vinh danh thành tích của bạn với báo cáo tiến trình chi tiết.",
    },
  ]

  // const testimonials = [
  //   {
  //     name: "Sarah Johnson",
  //     role: "Project Manager",
  //     content:
  //       "TaskLoad has transformed how our team manages projects. The intuitive interface and powerful features have boosted our productivity by 30%.",
  //   },
  //   {
  //     name: "Michael Chen",
  //     role: "Software Developer",
  //     content:
  //       "As a developer juggling multiple tasks, TaskLoad helps me stay organized and focused. The task prioritization feature is a game-changer.",
  //   },
  //   {
  //     name: "Emily Rodriguez",
  //     role: "Marketing Director",
  //     content:
  //       "TaskLoad has simplified our campaign management process. The collaborative features make it easy to coordinate with team members across departments.",
  //   },
  // ]

  return (
    <Box className={styles.landingPage}>
      {/* Header/Navigation */}
      <AppBar position="fixed" color="transparent" elevation={0} className={styles.appBar}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Box className={styles.logoContainer}>
              <DiamondIcon className={styles.logo} />
              <Typography variant="h5" component="div" className={styles.logoText}>
                TaskLoad
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {isMobile ? (
              <>
                <IconButton edge="end" color="inherit" aria-label="menu" onClick={handleMobileMenuToggle}>
                  <MenuIcon />
                </IconButton>

                <Drawer
                  anchor="right"
                  open={mobileMenuOpen}
                  onClose={handleMobileMenuToggle}
                  classes={{ paper: styles.mobileDrawer }}
                >
                  <Box className={styles.mobileDrawerHeader}>
                    <IconButton onClick={handleMobileMenuToggle}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <Divider />
                  <List>
                    <ListItem button component={RouterLink} to="/login">
                      <ListItemText primary="Đăng nhập" />
                    </ListItem>
                    <ListItem button component={RouterLink} to="/register">
                      <ListItemText primary="Đăng ký" className={styles.registerText} />
                    </ListItem>
                  </List>
                </Drawer>
              </>
            ) : (
              <Box className={styles.navButtons}>
                <Button component={RouterLink} to="/login" color="inherit" className={styles.loginButton}>
                  Đăng nhập
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  className={styles.registerButton}
                >
                  Đăng ký
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box className={styles.heroSection}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" className={styles.heroTitle}>
                Quản lý công việc dễ dàng và hiệu quả
              </Typography>
              <Typography variant="h6" className={styles.heroSubtitle}>
                TaskLoad giúp bạn tổ chức công việc, hợp tác với đội ngũ và tăng hiệu quả làm việc.
              </Typography>
              <Box className={styles.heroCta}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  size="large"
                  className={styles.heroRegisterButton}
                >
                  Đăng ký miễn phí
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  className={styles.heroLoginButton}
                >
                  Đăng nhập
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className={styles.heroImageContainer}>
                <img
                  src="/placeholder.svg?height=400&width=500"
                  alt="TaskLoad Dashboard Preview"
                  className={styles.heroImage}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className={styles.featuresSection}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" className={styles.sectionTitle}>
            Tính năng mạnh mẽ
          </Typography>
          <Typography variant="h6" className={styles.sectionSubtitle}>
            Mọi thứ bạn cần để quản lý công việc hiệu quả
          </Typography>

          <Grid container spacing={4} className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card className={styles.featureCard}>
                  <CardContent className={styles.featureCardContent}>
                    <Box className={styles.featureIconContainer}>{feature.icon}</Box>
                    <Typography variant="h5" component="h3" className={styles.featureTitle}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" className={styles.featureDescription}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box className={styles.howItWorksSection}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" className={styles.sectionTitle}>
            Hướng dẫn sử dụng
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box className={styles.howItWorksImageContainer}>
                <img
                  src="/placeholder.svg?height=400&width=500"
                  alt="TaskLoad Workflow"
                  className={styles.howItWorksImage}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className={styles.howItWorksList}>
                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    1. Tạo tài khoản
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Đăng ký TaskLoad trong vài giây và thiết lập hồ sơ của bạn.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    2. Thêm công việc
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Tạo công việc, ưu tiên và gán hạn chót.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    3. Tương tác với đội ngũ
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Mời thành viên đội ngũ và giao phó công việc để làm việc hiệu quả cùng nhau.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    4. Theo dõi tiến trình
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Theo dõi tiến trình và vinh danh thành tích của bạn.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      {/* <Box className={styles.testimonialsSection}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" className={styles.sectionTitle}>
            What Our Users Say
          </Typography>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card className={styles.testimonialCard}>
                  <CardContent className={styles.testimonialCardContent}>
                    <Typography variant="body1" className={styles.testimonialContent}>
                      "{testimonial.content}"
                    </Typography>
                    <Box className={styles.testimonialAuthor}>
                      <Typography variant="h6" component="p" className={styles.testimonialName}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" className={styles.testimonialRole}>
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box> */}

      {/* CTA Section */}
      <Box className={styles.ctaSection}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" className={styles.ctaTitle}>
            Hãy đẩy mạnh tiềm năng của bạn!
          </Typography>
          <Typography variant="h6" className={styles.ctaSubtitle}>
            Tham gia hàng nghìn người dùng đã quản lý công việc của mình hiệu quả với TaskLoad.
          </Typography>
          <Box className={styles.ctaButtons}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              size="large"
              className={styles.ctaRegisterButton}
            >
              Đăng ký miễn phí
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              className={styles.ctaLoginButton}
            >
              Đăng nhập
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box className={styles.footer}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box className={styles.footerLogoContainer}>
                <DiamondIcon className={styles.footerLogo} />
                <Typography variant="h6" component="div" className={styles.footerLogoText}>
                  TaskLoad
                </Typography>
              </Box>
              <Typography variant="body2" className={styles.footerDescription}>
                TaskLoad là một ứng dụng quản lý công việc mạnh mẽ được thiết kế để giúp cá nhân và đội ngũ tổ chức
                tổ chức công việc hiệu quả.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" className={styles.footerSectionTitle}>
                Nhanh chóng
              </Typography>
              <Box component="ul" className={styles.footerLinks}>
                <Box component="li">
                  <RouterLink to="/register" className={styles.footerLink}>
                    Đăng ký
                  </RouterLink>
                </Box>
                <Box component="li">
                  <RouterLink to="/login" className={styles.footerLink}>
                    Đăng nhập
                  </RouterLink>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" className={styles.footerSectionTitle}>
                Liên hệ
              </Typography>
              <Box component="ul" className={styles.footerLinks}>
                <Box component="li" className={styles.footerContactItem}>
                  Email: support@taskload.com
                </Box>
                <Box component="li" className={styles.footerContactItem}>
                  Phone: 0909090909
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box className={styles.footerBottom}>
            <Typography variant="body2" className={styles.copyright}>
              {new Date().getFullYear()} TaskLoad. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
