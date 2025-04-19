import express from "express"
import taskRoutes from "./taskRoutes.js"
import authRoutes from "./authRoutes.js"
import dashboardRoutes from "./dashboardRoutes.js"
import projectRoutes from "./projectRoutes.js"
// import userRoutes from "./userRoutes.js"
const router = express.Router()

router.use("/tasks", taskRoutes)
router.use("/auth", authRoutes)
router.use("/dashboard", dashboardRoutes)
router.use("/projects", projectRoutes)
// router.use("/user", userRoutes)
export default router

