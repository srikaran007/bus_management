const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true },
    busName: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    routeName: { type: String, trim: true },
    startingPoint: { type: String, trim: true },
    endingPoint: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Maintenance", "Idle"], default: "Active" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);
