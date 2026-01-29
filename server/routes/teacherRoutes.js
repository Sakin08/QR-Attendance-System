const express = require("express");
const { body, param, query } = require("express-validator");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { qrLimiter, exportLimiter } = require("../middleware/rateLimiter");
const {
  createPreset,
  getPresets,
  updatePreset,
  deletePreset,
  generateQR,
  getAttendance,
  exportAttendance,
  getSessionStats,
} = require("../controllers/teacherController");

const router = express.Router();

// Apply auth and role check to all routes
router.use(auth);
router.use(roleCheck("teacher"));

// Validation rules
const presetValidation = [
  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Department must be between 2 and 50 characters"),
  body("batch")
    .trim()
    .notEmpty()
    .withMessage("Batch is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Batch must be between 1 and 20 characters"),
  body("course")
    .trim()
    .notEmpty()
    .withMessage("Course is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Course must be between 2 and 100 characters"),
  body("classType")
    .notEmpty()
    .withMessage("Class type is required")
    .isIn(["Theory", "Lab", "Tutorial", "Seminar"])
    .withMessage("Class type must be Theory, Lab, Tutorial, or Seminar"),
  body("section")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["", "A", "B", "C", "D"])
    .withMessage("Section must be A, B, C, or D"),
];

const mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

const presetIdValidation = [
  param("presetId").isMongoId().withMessage("Invalid preset ID format"),
];

const sessionIdValidation = [
  param("sessionId").isMongoId().withMessage("Invalid session ID format"),
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
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["attendanceDate", "attendanceTime", "studentName", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

// Routes

// Class Presets
router.post("/presets", presetValidation, createPreset);
router.get("/presets", getPresets);
router.put("/presets/:id", mongoIdValidation, presetValidation, updatePreset);
router.delete("/presets/:id", mongoIdValidation, deletePreset);

// QR Code Generation
router.post(
  "/generate-qr/:presetId",
  qrLimiter,
  presetIdValidation,
  generateQR,
);

// Session Statistics
router.get("/session-stats/:sessionId", sessionIdValidation, getSessionStats);

// Attendance Records
router.get(
  "/attendance/:presetId",
  presetIdValidation,
  attendanceQueryValidation,
  getAttendance,
);

// Export Attendance
router.get(
  "/export/:presetId",
  exportLimiter,
  presetIdValidation,
  [
    query("format")
      .optional()
      .isIn(["excel", "csv"])
      .withMessage("Format must be excel or csv"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date"),
  ],
  exportAttendance,
);

module.exports = router;
