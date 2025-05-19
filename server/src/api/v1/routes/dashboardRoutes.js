import express from "express"
import * as dashboardController from "../controllers/dashboardController.js"
import auth from "../../../middlewares/auth.js"
import { checkResourceOwnership } from "../../../utils/permissionMiddleware.js"

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth.verifyToken)

// Get dashboard overview (tasks + projects)
router.get("/", dashboardController.getDashboardData)
// Get activity data
router.get("/activity", dashboardController.getActivityData)

// Get user-specific dashboard data
router.get("/user/:userId", checkResourceOwnership('User', 'userId'), dashboardController.getDashboardData)

export default router
