import express from "express"
import DashboardController from "../controllers/dashboardController.js"
import auth from "../../../middlewares/auth.js"
import { checkResourceOwnership } from "../../../utils/permissionMiddleware.js"

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth.verifyToken)

// Get dashboard overview (tasks + projects)
router.get("/", DashboardController.getDashboardData)
// Get activity data
router.get("/activity", DashboardController.getActivityData)

// Get user-specific dashboard data
router.get("/user/:userId", checkResourceOwnership('User', 'userId'), DashboardController.getDashboardData)

export default router
