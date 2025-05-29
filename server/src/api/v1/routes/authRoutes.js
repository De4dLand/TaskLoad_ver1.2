import express from "express"
import auth from "../../../middlewares/auth.js"
import { validateRegister, validateLogin } from "../validator/authValidator.js"
import authController from "../controllers/authController.js"

const router = express.Router()

// Public routes
router.post("/register", validateRegister, authController.register)
router.post("/login", validateLogin, authController.login)
router.post("/forgot-password", authController.requestPasswordReset)
// router.post("/reset-password/:token", validatePasswordReset, authController.resetPassword)

// Protected routes
router.use(auth.verifyToken)
router.post("/logout", authController.logout)
router.post("/refresh-token", authController.refreshToken)

// Protected routes
router.get("/me", authController.getCurrentUser)
router.put("/me", authController.updateProfile)

export default router

