const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "register",
        "failed_login",
        "qr_generated",
        "attendance_marked",
        "preset_created",
        "preset_updated",
        "preset_deleted",
        "bulk_import",
        "export_data",
        "suspicious_activity",
      ],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    suspiciousFlag: {
      type: Boolean,
      default: false,
      index: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// TTL index to automatically delete old logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Index for suspicious activity monitoring
activityLogSchema.index({ suspiciousFlag: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
