const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    attendanceType: { type: String, enum: ["Morning", "Evening"], required: true },
    subjectType: { type: String, enum: ["Driver", "Student"], required: true },
    subjectId: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Present", "Absent", "Leave"], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
