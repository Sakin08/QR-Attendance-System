const rateLimit = require("express-rate-limit");

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// QR generation limiter
const qrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 QR generations per 5 minutes
  message: {
    success: false,
    message:
      "Too many QR code generation requests, please wait before generating another.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Attendance marking limiter
const attendanceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 attendance marks per minute
  message: {
    success: false,
    message: "Too many attendance marking attempts, please wait.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Export data limiter
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 exports per 10 minutes
  message: {
    success: false,
    message: "Too many export requests, please wait before exporting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  qrLimiter,
  attendanceLimiter,
  exportLimiter,
};
