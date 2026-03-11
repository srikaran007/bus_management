const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, unique: true, trim: true },
    routeName: { type: String, required: true, trim: true },
    startingPoint: { type: String, required: true, trim: true },
    endingPoint: { type: String, required: true, trim: true },
    stops: [{ type: String, trim: true }],
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", routeSchema);
