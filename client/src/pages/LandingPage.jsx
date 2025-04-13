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
import { isAuthenticated } from "../components/features/auth/services/authService"
import styles from "./LandingPage.module.css"

const LandingPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard")
    }
  }, [navigate])

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const features = [
    {
      icon: <Dashboard fontSize="large" className={styles.featureIcon} />,
      title: "Intuitive Dashboard",
      description: "Get a clear overview of all your tasks, projects, and deadlines at a glance.",
    },
    {
      icon: <Assignment fontSize="large" className={styles.featureIcon} />,
      title: "Task Management",
      description: "Create, organize, and prioritize tasks with ease. Track progress and never miss a deadline.",
    },
    {
      icon: <People fontSize="large" className={styles.featureIcon} />,
      title: "Team Collaboration",
      description: "Work seamlessly with your team. Assign tasks, share updates, and monitor progress together.",
    },
    {
      icon: <DateRange fontSize="large" className={styles.featureIcon} />,
      title: "Calendar Integration",
      description: "Visualize your schedule and manage your time effectively with our integrated calendar.",
    },
    {
      icon: <Notifications fontSize="large" className={styles.featureIcon} />,
      title: "Smart Notifications",
      description: "Stay on top of your work with timely reminders and notifications about important deadlines.",
    },
    {
      icon: <CheckCircleOutline fontSize="large" className={styles.featureIcon} />,
      title: "Progress Tracking",
      description: "Monitor your productivity and celebrate your achievements with detailed progress reports.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager",
      content:
        "TaskLoad has transformed how our team manages projects. The intuitive interface and powerful features have boosted our productivity by 30%.",
    },
    {
      name: "Michael Chen",
      role: "Software Developer",
      content:
        "As a developer juggling multiple tasks, TaskLoad helps me stay organized and focused. The task prioritization feature is a game-changer.",
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      content:
        "TaskLoad has simplified our campaign management process. The collaborative features make it easy to coordinate with team members across departments.",
    },
  ]

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
                      <ListItemText primary="Login" />
                    </ListItem>
                    <ListItem button component={RouterLink} to="/register">
                      <ListItemText primary="Register" className={styles.registerText} />
                    </ListItem>
                  </List>
                </Drawer>
              </>
            ) : (
              <Box className={styles.navButtons}>
                <Button component={RouterLink} to="/login" color="inherit" className={styles.loginButton}>
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  className={styles.registerButton}
                >
                  Register
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
                Manage Tasks with Ease and Efficiency
              </Typography>
              <Typography variant="h6" className={styles.heroSubtitle}>
                TaskLoad helps you organize your work, collaborate with your team, and boost productivity.
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
                  Get Started
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  className={styles.heroLoginButton}
                >
                  Login
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
            Powerful Features
          </Typography>
          <Typography variant="h6" className={styles.sectionSubtitle}>
            Everything you need to manage your tasks effectively
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
            How It Works
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
                    1. Create Your Account
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Sign up for TaskLoad in seconds and set up your profile.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    2. Add Your Tasks
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Create tasks, set priorities, and assign deadlines.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    3. Collaborate with Your Team
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Invite team members and assign tasks to collaborate effectively.
                  </Typography>
                </Box>

                <Box className={styles.howItWorksItem}>
                  <Typography variant="h6" component="h3" className={styles.howItWorksTitle}>
                    4. Track Progress
                  </Typography>
                  <Typography variant="body1" className={styles.howItWorksDescription}>
                    Monitor task completion and celebrate your achievements.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box className={styles.testimonialsSection}>
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
      </Box>

      {/* CTA Section */}
      <Box className={styles.ctaSection}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" className={styles.ctaTitle}>
            Ready to Boost Your Productivity?
          </Typography>
          <Typography variant="h6" className={styles.ctaSubtitle}>
            Join thousands of users who are already managing their tasks efficiently with TaskLoad.
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
              Get Started for Free
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              className={styles.ctaLoginButton}
            >
              Login
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
                TaskLoad is a powerful task management application designed to help individuals and teams organize their
                work efficiently.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" className={styles.footerSectionTitle}>
                Quick Links
              </Typography>
              <Box component="ul" className={styles.footerLinks}>
                <Box component="li">
                  <RouterLink to="/register" className={styles.footerLink}>
                    Get Started
                  </RouterLink>
                </Box>
                <Box component="li">
                  <RouterLink to="/login" className={styles.footerLink}>
                    Login
                  </RouterLink>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" className={styles.footerSectionTitle}>
                Contact
              </Typography>
              <Box component="ul" className={styles.footerLinks}>
                <Box component="li" className={styles.footerContactItem}>
                  Email: support@taskload.com
                </Box>
                <Box component="li" className={styles.footerContactItem}>
                  Phone: (123) 456-7890
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box className={styles.footerBottom}>
            <Typography variant="body2" className={styles.copyright}>
              © {new Date().getFullYear()} TaskLoad. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
