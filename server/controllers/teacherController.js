const { validationResult } = require("express-validator");
const ClassPreset = require("../models/ClassPreset");
const QRSession = require("../models/QRSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const ActivityLog = require("../models/ActivityLog");
const { generateQRToken } = require("../utils/qrEncryption");
const { exportAttendanceToExcel } = require("../utils/excelExport");

// Create class preset
const createPreset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { department, batch, course, classType, section } = req.body;

    // Check if preset already exists for this teacher
    const existingPreset = await ClassPreset.findOne({
      teacherId: req.user._id,
      department,
      batch,
      course,
      classType,
      section: section || null,
    });

    if (existingPreset) {
      return res.status(400).json({
        success: false,
        message: "A preset with these details already exists",
      });
    }

    const preset = new ClassPreset({
      teacherId: req.user._id,
      department,
      batch,
      course,
      classType,
      section: section || null,
    });

    await preset.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "preset_created",
      details: { presetId: preset._id, course, department, batch },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Class preset created successfully",
      data: { preset },
    });
  } catch (error) {
    console.error("Create preset error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating preset",
    });
  }
};

// Get all presets for teacher
const getPresets = async (req, res) => {
  try {
    const presets = await ClassPreset.find({
      teacherId: req.user._id,
      isActive: true,
    }).sort({ lastUsed: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { presets },
    });
  } catch (error) {
    console.error("Get presets error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching presets",
    });
  }
};

// Update preset
const updatePreset = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const preset = await ClassPreset.findOne({
      _id: id,
      teacherId: req.user._id,
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    Object.assign(preset, updates);
    await preset.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "preset_updated",
      details: { presetId: preset._id, updates },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Preset updated successfully",
      data: { preset },
    });
  } catch (error) {
    console.error("Update preset error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating preset",
    });
  }
};

// Delete preset
const deletePreset = async (req, res) => {
  try {
    const { id } = req.params;

    const preset = await ClassPreset.findOne({
      _id: id,
      teacherId: req.user._id,
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    preset.isActive = false;
    await preset.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "preset_deleted",
      details: { presetId: preset._id },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Preset deleted successfully",
    });
  } catch (error) {
    console.error("Delete preset error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting preset",
    });
  }
};

// Generate QR code for attendance
const generateQR = async (req, res) => {
  try {
    const { presetId } = req.params;

    const preset = await ClassPreset.findOne({
      _id: presetId,
      teacherId: req.user._id,
      isActive: true,
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    // Check if there's an active session for this preset
    const existingSession = await QRSession.findOne({
      presetId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
      return res.json({
        success: true,
        message: "Active QR session found",
        data: {
          session: existingSession,
          qrToken: existingSession.qrToken,
          remainingSeconds: existingSession.remainingSeconds,
        },
      });
    }

    // Create new QR session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 1000); // 90 seconds

    const sessionData = {
      sessionId: null, // Will be set after creation
      presetId,
      teacherId: req.user._id,
    };

    const qrToken = generateQRToken(sessionData);

    const session = new QRSession({
      presetId,
      teacherId: req.user._id,
      qrToken,
      generatedAt: now,
      expiresAt,
      attendanceDate: now,
      attendanceTime: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });

    await session.save();

    // Update preset last used
    preset.lastUsed = now;
    preset.totalSessions += 1;
    await preset.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "qr_generated",
      details: {
        presetId,
        sessionId: session._id,
        course: preset.course,
        department: preset.department,
        batch: preset.batch,
      },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "QR code generated successfully",
      data: {
        session,
        qrToken,
        remainingSeconds: 90,
        presetInfo: {
          course: preset.course,
          department: preset.department,
          batch: preset.batch,
          section: preset.section,
          classType: preset.classType,
        },
      },
    });
  } catch (error) {
    console.error("Generate QR error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating QR code",
    });
  }
};

// Get attendance records for a preset
const getAttendance = async (req, res) => {
  try {
    const { presetId } = req.params;
    const {
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = "attendanceDate",
      sortOrder = "desc",
    } = req.query;

    // Verify preset belongs to teacher
    const preset = await ClassPreset.findOne({
      _id: presetId,
      teacherId: req.user._id,
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    // Build query
    const query = { presetId };

    if (startDate || endDate) {
      query.attendanceDate = {};
      if (startDate) query.attendanceDate.$gte = new Date(startDate);
      if (endDate) query.attendanceDate.$lte = new Date(endDate);
    }

    // Get total count
    const total = await AttendanceRecord.countDocuments(query);

    // Get records with pagination
    const records = await AttendanceRecord.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("studentId", "name email studentId");

    // Calculate statistics
    const stats = await AttendanceRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statistics = {
      total,
      present: stats.find((s) => s._id === "Present")?.count || 0,
      late: stats.find((s) => s._id === "Late")?.count || 0,
      excused: stats.find((s) => s._id === "Excused")?.count || 0,
    };

    statistics.attendanceRate =
      total > 0
        ? (((statistics.present + statistics.excused) / total) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        records,
        statistics,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
        presetInfo: preset,
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    });
  }
};

// Export attendance to Excel
const exportAttendance = async (req, res) => {
  try {
    const { presetId } = req.params;
    const { startDate, endDate, format = "excel" } = req.query;

    // Verify preset belongs to teacher
    const preset = await ClassPreset.findOne({
      _id: presetId,
      teacherId: req.user._id,
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: "Preset not found",
      });
    }

    // Build query
    const query = { presetId };
    if (startDate || endDate) {
      query.attendanceDate = {};
      if (startDate) query.attendanceDate.$gte = new Date(startDate);
      if (endDate) query.attendanceDate.$lte = new Date(endDate);
    }

    // Get records
    const records = await AttendanceRecord.find(query)
      .sort({ attendanceDate: -1, attendanceTime: -1 })
      .populate("studentId", "name email studentId");

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the specified criteria",
      });
    }

    // Generate Excel file
    const buffer = await exportAttendanceToExcel(records, preset, {
      startDate,
      endDate,
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "export_data",
      details: {
        presetId,
        recordCount: records.length,
        format,
        dateRange: { startDate, endDate },
      },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    // Set headers for file download
    const filename = `attendance_${preset.course}_${preset.department}_${preset.batch}_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error("Export attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while exporting attendance",
    });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await QRSession.findOne({
      _id: sessionId,
      teacherId: req.user._id,
    }).populate("presetId");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Get real-time attendance count
    const attendanceCount = await AttendanceRecord.countDocuments({
      sessionId: session._id,
    });

    // Get recent attendees
    const recentAttendees = await AttendanceRecord.find({
      sessionId: session._id,
    })
      .sort({ markedAt: -1 })
      .limit(10)
      .select("studentName studentNumber markedAt status");

    res.json({
      success: true,
      data: {
        session,
        attendanceCount,
        recentAttendees,
        isActive: session.isActive && !session.isExpired,
        remainingSeconds: session.remainingSeconds,
      },
    });
  } catch (error) {
    console.error("Get session stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching session statistics",
    });
  }
};

module.exports = {
  createPreset,
  getPresets,
  updatePreset,
  deletePreset,
  generateQR,
  getAttendance,
  exportAttendance,
  getSessionStats,
};
