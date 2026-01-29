const mongoose = require("mongoose");

const qrSessionSchema = new mongoose.Schema(
  {
    presetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassPreset",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
    },
    attendanceTime: {
      type: String,
      required: true,
    },
    // Session statistics
    totalScans: {
      type: Number,
      default: 0,
    },
    uniqueAttendees: {
      type: Number,
      default: 0,
    },
    // Security tracking
    suspiciousActivity: [
      {
        studentId: mongoose.Schema.Types.ObjectId,
        reason: String,
        timestamp: Date,
        ipAddress: String,
        deviceFingerprint: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// TTL index to automatically delete expired sessions after 1 hour
qrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Virtual to check if session is expired
qrSessionSchema.virtual("isExpired").get(function () {
  return Date.now() > this.expiresAt;
});

// Virtual to get remaining time in seconds
qrSessionSchema.virtual("remainingSeconds").get(function () {
  const remaining = Math.max(0, this.expiresAt - Date.now());
  return Math.floor(remaining / 1000);
});

module.exports = mongoose.model("QRSession", qrSessionSchema);
