import { body, param, query } from "express-validator"
import { validateRequest } from "../../../middlewares/validate.js"

// Validate task creation and updates
export const validateTask = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("status")
    .optional()
    .isIn(["todo", "in_progress", "review", "completed"])
    .withMessage("Status must be one of: todo, in_progress, review, completed"),

  body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Priority must be one of: low, medium, high"),

  body("dueDate").optional().isISO8601().withMessage("Due date must be a valid ISO 8601 date"),

  body("project").optional().isMongoId().withMessage("Project must be a valid MongoDB ID"),

  body("assignedTo").optional().isMongoId().withMessage("AssignedTo must be a valid MongoDB ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*").optional().isString().withMessage("Each tag must be a string"),

  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number")
    .isFloat({ min: 0 })
    .withMessage("Estimated hours must be a positive number"),

  body("actualHours")
    .optional()
    .isNumeric()
    .withMessage("Actual hours must be a number")
    .isFloat({ min: 0 })
    .withMessage("Actual hours must be a positive number"),

  body("subtasks").optional().isArray().withMessage("Subtasks must be an array"),

  body("subtasks.*.title").optional().isString().withMessage("Subtask title must be a string"),

  body("subtasks.*.completed").optional().isBoolean().withMessage("Subtask completed must be a boolean"),

  validateRequest,
]

// Validate status update
export const validateStatusUpdate = [
  param("id").isMongoId().withMessage("Invalid task ID format"),

  body("status")
    .isIn(["todo", "in_progress", "review", "completed"])
    .withMessage("Status must be one of: todo, in_progress, review, completed"),

  body("statusChangedAt")
    .optional()
    .isISO8601()
    .withMessage("Status change timestamp must be a valid ISO 8601 date"),

  body("statusChangedBy")
    .optional()
    .isMongoId()
    .withMessage("Status changed by must be a valid MongoDB ID"),

  body("comment")
    .optional()
    .isString()
    .withMessage("Status change comment must be a string")
    .isLength({ max: 500 })
    .withMessage("Status change comment cannot exceed 500 characters"),

  validateRequest,
]

// Validate task list query parameters
export const validateTaskListQuery = [
  query("status")
    .optional()
    .isIn(["todo", "in_progress", "review", "completed"])
    .withMessage("Status must be one of: todo, in_progress, review, completed"),

  query("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be one of: low, medium, high"),

  query("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

  validateRequest,
]
