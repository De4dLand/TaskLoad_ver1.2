import express from "express"
import * as dashboardController from "../controllers/dashboardController.js"
import auth from "../../../middlewares/auth.js"

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Get dashboard overview (tasks + projects)
router.get("/", dashboardController.getDashboardData)
// Get activity data
router.get("/activity", dashboardController.getActivityData)

export default router
