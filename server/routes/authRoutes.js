const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  register,
  login,
  refreshToken,
  getMe,
  logout,
} = require("../controllers/authController");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
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
  body("studentId")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("Student ID is required for students")
    .isLength({ min: 3, max: 20 })
    .withMessage("Student ID must be between 3 and 20 characters"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post(
  "/register",
  authLimiter,
  registerValidation,
  (req, res, next) => {
    console.log("Register route hit:", req.body);
    next();
  },
  register,
);
router.post("/login", authLimiter, loginValidation, login);
router.post("/refresh-token", refreshToken);
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);

module.exports = router;
