const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    requestId: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    role: { type: String, trim: true, index: true },
    method: { type: String, required: true, trim: true, index: true },
    path: { type: String, required: true, trim: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    durationMs: { type: Number, required: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    requestBody: { type: mongoose.Schema.Types.Mixed },
    query: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
