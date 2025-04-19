import { body, param } from "express-validator"
import User from "../../../models/User.js"

export const authValidation = {
  register: [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers and underscores")
      .custom(async (value) => {
        const user = await User.findOne({ username: value })
        if (user) {
          throw new Error("Username is already taken")
        }
        return true
      }),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .custom(async (value) => {
        const user = await User.findOne({ email: value.toLowerCase() })
        if (user) {
          throw new Error("Email is already registered")
        }
        return true
      }),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),

    body("firstName")
      .optional()
      .isString()
      .withMessage("First name must be a string")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters")
      .trim(),

    body("lastName")
      .optional()
      .isString()
      .withMessage("Last name must be a string")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters")
      .trim(),
  ],

  login: [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address"),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  forgotPassword: [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address"),
  ],

  resetPassword: [
    param("token")
      .notEmpty()
      .withMessage("Token is required")
      .isLength({ min: 32, max: 64 })
      .withMessage("Invalid token format"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),

    body("confirmPassword")
      .notEmpty()
      .withMessage("Password confirmation is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match")
        }
        return true
      }),
  ],

  updateProfile: [
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers and underscores")
      .custom(async (value, { req }) => {
        const user = await User.findOne({
          username: value,
          _id: { $ne: req.user.userId },
        })

        if (user) {
          throw new Error("Username is already taken")
        }
        return true
      }),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .custom(async (value, { req }) => {
        const user = await User.findOne({
          email: value.toLowerCase(),
          _id: { $ne: req.user.userId },
        })

        if (user) {
          throw new Error("Email is already registered")
        }
        return true
      }),

    body("firstName")
      .optional()
      .isString()
      .withMessage("First name must be a string")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters")
      .trim(),

    body("lastName")
      .optional()
      .isString()
      .withMessage("Last name must be a string")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters")
      .trim(),

    body("profileImage").optional().isString().withMessage("Profile image must be a string").trim(),
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),

    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/\d/)
      .withMessage("New password must contain at least one number")
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error("New password cannot be the same as current password")
        }
        return true
      }),

    body("confirmPassword")
      .notEmpty()
      .withMessage("Password confirmation is required")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Passwords do not match")
        }
        return true
      }),
  ],

  refreshToken: [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token is required")
      .isJWT()
      .withMessage("Invalid refresh token format"),
  ],

  verifyEmail: [
    param("token")
      .notEmpty()
      .withMessage("Token is required")
      .isLength({ min: 32, max: 64 })
      .withMessage("Invalid token format"),
  ],
}
