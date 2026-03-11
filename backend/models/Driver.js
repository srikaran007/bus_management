const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverName: { type: String, required: true, trim: true },
    driverId: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    experience: { type: String, trim: true },
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
    status: { type: String, enum: ["Active", "Inactive", "Leave"], default: "Active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
