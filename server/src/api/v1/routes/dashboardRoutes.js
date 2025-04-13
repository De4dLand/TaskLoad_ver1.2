import express from "express"
import * as dashboardController from "../controllers/dashboardController.js"
import auth from "../../../middlewares/auth.js"

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// Get activity data
router.get("/activity", dashboardController.getActivityData)

export default router

