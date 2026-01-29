const { validationResult } = require("express-validator");
const QRSession = require("../models/QRSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const ClassPreset = require("../models/ClassPreset");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { verifyQRToken } = require("../utils/qrEncryption");

// Mark attendance using QR token
const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { qrToken, location } = req.body;
    const student = req.user;

    // Verify QR token
    const tokenVerification = verifyQRToken(qrToken);
    if (!tokenVerification.valid) {
      await ActivityLog.create({
        userId: student._id,
        action: "suspicious_activity",
        details: {
          reason: "invalid_qr_token",
          error: tokenVerification.error,
        },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
        riskScore: 70,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid or expired QR code",
      });
    }

    // Find the QR session
    const session = await QRSession.findOne({
      qrToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate("presetId");

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "QR code has expired or is invalid",
      });
    }

    const preset = session.presetId;

    // Verify student belongs to the correct department and batch
    if (
      student.department !== preset.department ||
      student.batch !== preset.batch
    ) {
      await ActivityLog.create({
        userId: student._id,
        action: "suspicious_activity",
        details: {
          reason: "wrong_department_batch",
          studentDept: student.department,
          studentBatch: student.batch,
          presetDept: preset.department,
          presetBatch: preset.batch,
        },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
        riskScore: 90,
      });

      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark attendance for this class",
      });
    }

    // Check if attendance already marked for this session
    const existingAttendance = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this session",
        data: {
          markedAt: existingAttendance.markedAt,
          status: existingAttendance.status,
        },
      });
    }

    // Check for rapid scanning (cooldown period)
    const recentActivity = await AttendanceRecord.findOne({
      studentId: student._id,
      deviceFingerprint: req.deviceFingerprint,
      markedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes
    });

    if (recentActivity) {
      await ActivityLog.create({
        userId: student._id,
        action: "suspicious_activity",
        details: {
          reason: "rapid_scanning",
          lastScan: recentActivity.markedAt,
        },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
        riskScore: 60,
      });

      return res.status(429).json({
        success: false,
        message: "Please wait before scanning another QR code",
      });
    }

    // Determine attendance status based on time
    let status = "Present";
    const currentTime = new Date();
    const sessionTime = new Date(session.generatedAt);
    const timeDifference = (currentTime - sessionTime) / (1000 * 60); // minutes

    if (timeDifference > 15) {
      status = "Late";
    }

    // Create attendance record
    const attendanceRecord = new AttendanceRecord({
      sessionId: session._id,
      presetId: preset._id,
      studentId: student._id,
      studentEmail: student.email,
      studentName: student.name,
      studentNumber: student.studentId,
      department: student.department,
      batch: student.batch,
      section: preset.section,
      course: preset.course,
      attendanceDate: session.attendanceDate,
      attendanceTime: session.attendanceTime,
      deviceFingerprint: req.deviceFingerprint,
      ipAddress: req.ip,
      status,
      location: location || null,
      isVerified: true,
    });

    await attendanceRecord.save();

    // Update session statistics
    await QRSession.updateOne(
      { _id: session._id },
      {
        $inc: {
          totalScans: 1,
          uniqueAttendees: 1,
        },
      },
    );

    // Log successful attendance
    await ActivityLog.create({
      userId: student._id,
      action: "attendance_marked",
      details: {
        sessionId: session._id,
        presetId: preset._id,
        course: preset.course,
        status,
        timeDifference: Math.round(timeDifference),
      },
      ipAddress: req.ip,
      deviceFingerprint: req.deviceFingerprint,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: `Attendance marked successfully as ${status}`,
      data: {
        attendanceRecord: {
          id: attendanceRecord._id,
          course: preset.course,
          department: preset.department,
          batch: preset.batch,
          status,
          markedAt: attendanceRecord.markedAt,
          attendanceDate: attendanceRecord.attendanceDate,
          attendanceTime: attendanceRecord.attendanceTime,
        },
      },
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    // Log error for monitoring
    if (req.user) {
      await ActivityLog.create({
        userId: req.user._id,
        action: "suspicious_activity",
        details: {
          reason: "attendance_marking_error",
          error: error.message,
        },
        ipAddress: req.ip,
        deviceFingerprint: req.deviceFingerprint,
        userAgent: req.headers["user-agent"],
        suspiciousFlag: true,
        riskScore: 50,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
    });
  }
};

// Get student's attendance history
const getMyAttendance = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      course,
      page = 1,
      limit = 20,
      sortBy = "attendanceDate",
      sortOrder = "desc",
    } = req.query;

    const student = req.user;

    // Build query
    const query = { studentId: student._id };

    if (startDate || endDate) {
      query.attendanceDate = {};
      if (startDate) query.attendanceDate.$gte = new Date(startDate);
      if (endDate) query.attendanceDate.$lte = new Date(endDate);
    }

    if (course) {
      query.course = new RegExp(course, "i");
    }

    // Get total count
    const total = await AttendanceRecord.countDocuments(query);

    // Get records with pagination
    const records = await AttendanceRecord.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-deviceFingerprint -ipAddress")
      .populate("presetId", "course classType");

    // Calculate statistics
    const stats = await AttendanceRecord.aggregate([
      { $match: { studentId: student._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statistics = {
      total: await AttendanceRecord.countDocuments({ studentId: student._id }),
      present: stats.find((s) => s._id === "Present")?.count || 0,
      late: stats.find((s) => s._id === "Late")?.count || 0,
      excused: stats.find((s) => s._id === "Excused")?.count || 0,
    };

    statistics.attendanceRate =
      statistics.total > 0
        ? (
            ((statistics.present + statistics.excused) / statistics.total) *
            100
          ).toFixed(2)
        : 0;

    // Get course-wise statistics
    const courseStats = await AttendanceRecord.aggregate([
      { $match: { studentId: student._id } },
      {
        $group: {
          _id: "$course",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          late: {
            $sum: {
              $cond: [{ $eq: ["$status", "Late"] }, 1, 0],
            },
          },
          excused: {
            $sum: {
              $cond: [{ $eq: ["$status", "Excused"] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: [{ $add: ["$present", "$excused"] }, "$total"] },
              100,
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        records,
        statistics,
        courseStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get my attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance history",
    });
  }
};

// Get attendance summary for dashboard
const getAttendanceSummary = async (req, res) => {
  try {
    const student = req.user;
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const startOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() - currentDate.getDay()),
    );

    // Overall statistics
    const totalAttendance = await AttendanceRecord.countDocuments({
      studentId: student._id,
    });

    const monthlyAttendance = await AttendanceRecord.countDocuments({
      studentId: student._id,
      attendanceDate: { $gte: startOfMonth },
    });

    const weeklyAttendance = await AttendanceRecord.countDocuments({
      studentId: student._id,
      attendanceDate: { $gte: startOfWeek },
    });

    // Recent attendance (last 5 records)
    const recentAttendance = await AttendanceRecord.find({
      studentId: student._id,
    })
      .sort({ attendanceDate: -1, markedAt: -1 })
      .limit(5)
      .select("course attendanceDate attendanceTime status")
      .populate("presetId", "classType");

    // Attendance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceTrend = await AttendanceRecord.aggregate([
      {
        $match: {
          studentId: student._id,
          attendanceDate: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$attendanceDate",
            },
          },
          count: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalAttendance,
          monthlyAttendance,
          weeklyAttendance,
        },
        recentAttendance,
        attendanceTrend,
      },
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance summary",
    });
  }
};

module.exports = {
  markAttendance,
  getMyAttendance,
  getAttendanceSummary,
};
