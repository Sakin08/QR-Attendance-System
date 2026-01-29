const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: 1,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for department and course code
courseSchema.index({ department: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
