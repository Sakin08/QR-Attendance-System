const mongoose = require("mongoose");

const classPresetSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    batch: {
      type: String,
      required: [true, "Batch is required"],
      trim: true,
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
    },
    classType: {
      type: String,
      enum: ["Theory", "Lab", "Tutorial", "Seminar"],
      required: [true, "Class type is required"],
    },
    section: {
      type: String,
      enum: ["A", "B", "C", "D", null],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Statistics
    totalSessions: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for faster queries
classPresetSchema.index({ teacherId: 1, isActive: 1 });
classPresetSchema.index({ department: 1, batch: 1, course: 1 });

// Ensure unique preset per teacher for same class configuration
classPresetSchema.index(
  {
    teacherId: 1,
    department: 1,
    batch: 1,
    course: 1,
    classType: 1,
    section: 1,
  },
  { unique: true },
);

module.exports = mongoose.model("ClassPreset", classPresetSchema);
