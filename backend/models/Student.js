const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, unique: true, trim: true },
    department: { type: String, trim: true },
    busNumber: { type: String, trim: true },
    routeName: { type: String, trim: true },
    boardingPoint: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
