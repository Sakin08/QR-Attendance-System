const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRSession",
      required: true,
      index: true,
    },
    presetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassPreset",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentNumber: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    batch: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      default: null,
    },
    course: {
      type: String,
      required: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },
    attendanceTime: {
      type: String,
      required: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Excused"],
      default: "Present",
    },
    // Geolocation (optional)
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    // Verification flags
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationFlags: [
      {
        type: String,
        enum: [
          "suspicious_device",
          "rapid_scan",
          "location_mismatch",
          "time_anomaly",
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
attendanceRecordSchema.index({ presetId: 1, attendanceDate: -1 });
attendanceRecordSchema.index({ studentId: 1, attendanceDate: -1 });
attendanceRecordSchema.index({ department: 1, batch: 1, attendanceDate: -1 });

// Index for device fingerprint tracking
attendanceRecordSchema.index({ deviceFingerprint: 1, markedAt: -1 });

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
