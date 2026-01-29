const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { attendanceLimiter } = require("../middleware/rateLimiter");
const {
  markAttendance,
  getMyAttendance,
  getAttendanceSummary,
} = require("../controllers/studentController");

const router = express.Router();

// Apply auth and role check to all routes
router.use(auth);
router.use(roleCheck("student"));

// Validation rules
const markAttendanceValidation = [
  body("qrToken")
    .notEmpty()
    .withMessage("QR token is required")
    .isLength({ min: 10 })
    .withMessage("Invalid QR token format"),
  body("location")
    .optional()
    .isObject()
    .withMessage("Location must be an object"),
  body("location.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("location.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
  body("location.accuracy")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid accuracy value"),
];

const attendanceQueryValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  query("course")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Course name must be between 1 and 100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("sortBy")
    .optional()
    .isIn(["attendanceDate", "attendanceTime", "course", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

// Routes

// Mark Attendance
router.post(
  "/mark-attendance",
  attendanceLimiter,
  markAttendanceValidation,
  markAttendance,
);

// Get My Attendance History
router.get("/my-attendance", attendanceQueryValidation, getMyAttendance);

// Get Attendance Summary for Dashboard
router.get("/attendance-summary", getAttendanceSummary);

module.exports = router;
