const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/generateToken");

// Register user
const register = async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, role, department, batch, studentId } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Validate university email domain for students (disabled for development)
    if (role === "student" && process.env.NODE_ENV === "production") {
      const emailDomain = email.split("@")[1];
      const allowedDomain =
        process.env.UNIVERSITY_EMAIL_DOMAIN || "university.edu";

      if (emailDomain !== allowedDomain) {
        return res.status(400).json({
          success: false,
          message: `Students must use university email domain: @${allowedDomain}`,
        });
      }

      // Check if student ID already exists
      if (studentId) {
        const existingStudent = await User.findOne({ studentId });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: "Student ID already exists",
          });
        }
      }
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      deviceFingerprints: [req.deviceFingerprint],
    };

    if (role === "student" || role === "teacher") {
      userData.department = department;
    }

    if (role === "student") {
      userData.batch = batch;
      userData.studentId = studentId;
    }

    const user = new User(userData);
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "register",
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Log failed login attempt
      await ActivityLog.create({
        userId: null,
        action: "failed_login",
        details: { email, reason: "user_not_found" },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await ActivityLog.create({
        userId: user._id,
        action: "failed_login",
        details: { reason: "account_locked" },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
      });

      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to multiple failed login attempts",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      await ActivityLog.create({
        userId: user._id,
        action: "failed_login",
        details: { reason: "invalid_password" },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login and device fingerprint
    user.lastLogin = new Date();
    if (!user.deviceFingerprints.includes(req.deviceFingerprint)) {
      if (user.deviceFingerprints.length >= 5) {
        user.deviceFingerprints.shift(); // Remove oldest
      }
      user.deviceFingerprints.push(req.deviceFingerprint);
    }
    await user.save();

    // Log successful login
    await ActivityLog.create({
      userId: user._id,
      action: "login",
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Log logout activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "logout",
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  logout,
};
