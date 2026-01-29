const express = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { exportLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

// Apply auth and role check to all routes
router.use(auth);
router.use(roleCheck("admin"));

// Placeholder controller functions (to be implemented)
const adminController = {
  // Department Management
  createDepartment: async (req, res) => {
    res.json({
      success: true,
      message: "Create department - To be implemented",
    });
  },
  getDepartments: async (req, res) => {
    res.json({ success: true, message: "Get departments - To be implemented" });
  },
  updateDepartment: async (req, res) => {
    res.json({
      success: true,
      message: "Update department - To be implemented",
    });
  },
  deleteDepartment: async (req, res) => {
    res.json({
      success: true,
      message: "Delete department - To be implemented",
    });
  },

  // Course Management
  createCourse: async (req, res) => {
    res.json({ success: true, message: "Create course - To be implemented" });
  },
  getCourses: async (req, res) => {
    res.json({ success: true, message: "Get courses - To be implemented" });
  },
  updateCourse: async (req, res) => {
    res.json({ success: true, message: "Update course - To be implemented" });
  },
  deleteCourse: async (req, res) => {
    res.json({ success: true, message: "Delete course - To be implemented" });
  },

  // User Management
  createUser: async (req, res) => {
    res.json({ success: true, message: "Create user - To be implemented" });
  },
  getUsers: async (req, res) => {
    res.json({ success: true, message: "Get users - To be implemented" });
  },
  updateUser: async (req, res) => {
    res.json({ success: true, message: "Update user - To be implemented" });
  },
  deleteUser: async (req, res) => {
    res.json({ success: true, message: "Delete user - To be implemented" });
  },

  // Bulk Import
  bulkImportUsers: async (req, res) => {
    res.json({
      success: true,
      message: "Bulk import users - To be implemented",
    });
  },

  // Reports
  getSystemReports: async (req, res) => {
    res.json({
      success: true,
      message: "Get system reports - To be implemented",
    });
  },
  getAttendanceReports: async (req, res) => {
    res.json({
      success: true,
      message: "Get attendance reports - To be implemented",
    });
  },

  // Activity Logs
  getActivityLogs: async (req, res) => {
    res.json({
      success: true,
      message: "Get activity logs - To be implemented",
    });
  },
};

// Validation rules
const departmentValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be between 2 and 100 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .isLength({ min: 2, max: 10 })
    .withMessage("Department code must be between 2 and 10 characters")
    .isAlphanumeric()
    .withMessage("Department code must be alphanumeric"),
];

const courseValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Course name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Course name must be between 2 and 100 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Course code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Course code must be between 2 and 20 characters"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("credits")
    .isInt({ min: 1, max: 10 })
    .withMessage("Credits must be between 1 and 10"),
];

const userValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("role")
    .isIn(["admin", "teacher", "student"])
    .withMessage("Role must be admin, teacher, or student"),
  body("department")
    .if(body("role").isIn(["teacher", "student"]))
    .notEmpty()
    .withMessage("Department is required for teachers and students"),
  body("batch")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("Batch is required for students"),
];

const mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

// Routes

// Department Management
router.post(
  "/departments",
  departmentValidation,
  adminController.createDepartment,
);
router.get("/departments", adminController.getDepartments);
router.put(
  "/departments/:id",
  mongoIdValidation,
  departmentValidation,
  adminController.updateDepartment,
);
router.delete(
  "/departments/:id",
  mongoIdValidation,
  adminController.deleteDepartment,
);

// Course Management
router.post("/courses", courseValidation, adminController.createCourse);
router.get("/courses", adminController.getCourses);
router.put(
  "/courses/:id",
  mongoIdValidation,
  courseValidation,
  adminController.updateCourse,
);
router.delete("/courses/:id", mongoIdValidation, adminController.deleteCourse);

// User Management
router.post("/users", userValidation, adminController.createUser);
router.get("/users", adminController.getUsers);
router.put(
  "/users/:id",
  mongoIdValidation,
  userValidation,
  adminController.updateUser,
);
router.delete("/users/:id", mongoIdValidation, adminController.deleteUser);

// Bulk Import
router.post(
  "/bulk-import",
  upload.single("csvFile"),
  adminController.bulkImportUsers,
);

// Reports
router.get("/reports/system", adminController.getSystemReports);
router.get(
  "/reports/attendance",
  exportLimiter,
  [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date"),
    query("department")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Department cannot be empty"),
    query("batch")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Batch cannot be empty"),
  ],
  adminController.getAttendanceReports,
);

// Activity Logs
router.get(
  "/activity-logs",
  [
    query("userId").optional().isMongoId().withMessage("Invalid user ID"),
    query("action")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Action cannot be empty"),
    query("suspiciousOnly")
      .optional()
      .isBoolean()
      .withMessage("Suspicious only must be a boolean"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  adminController.getActivityLogs,
);

module.exports = router;
