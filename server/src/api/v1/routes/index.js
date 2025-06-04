import express from "express"
import taskRoutes from "./taskRoutes.js"
import authRoutes from "./authRoutes.js"
import dashboardRoutes from "./dashboardRoutes.js"
import projectRoutes from "./projectRoutes.js"
import userRoutes from "./userRoutes.js"
import chatRoutes from "./chatRoutes.js"
// import teamRoutes from "./teamRoutes.js"
// import notificationRoutes from "./notificationRoutes.js"
const router = express.Router()

router.use("/tasks", taskRoutes)
router.use("/auth", authRoutes)
router.use("/dashboard", dashboardRoutes)
router.use("/projects", projectRoutes)
router.use("/users", userRoutes)  // Changed from /user to /users for consistency
router.use("/chat", chatRoutes)
// router.use("/teams", teamRoutes)
// router.use("/notifications", notificationRoutes)
export default router

