import express from "express"
import {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile
} from "../controllers/authController.js"
import auth from "../../../middlewares/auth.js"
import { validateRegister, validateLogin, validatePassword } from "../validator/authValidator.js"

const router = express.Router()

// Public routes
router.post("/register", validateRegister, register)
router.post("/login", validateLogin, login)
router.post("/logout", logout)
router.post("/refresh-token", refreshToken)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", validatePassword, resetPassword)

// Protected routes
router.get("/me", auth, getCurrentUser)
router.put("/profile", auth, updateProfile)

export default router

