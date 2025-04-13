import { body } from "express-validator"

export const validateRegister = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
]

export const validateLogin = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

export const validatePassword = [
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
]

