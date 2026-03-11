const mongoose = require("mongoose");

const entryExitLogSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, trim: true },
    driverName: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Running", "Completed"], default: "Running" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EntryExitLog", entryExitLogSchema);
