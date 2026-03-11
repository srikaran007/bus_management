const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../utils/constants");

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,/]+$/g, "");

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,/]+$/g, "");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, set: normalizeEmail },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER],
      default: ROLES.STUDENT,
      set: normalizeRole
    },
    phone: { type: String, trim: true },
    refreshTokenHash: { type: String },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();

  const isAlreadyHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
  if (isAlreadyHashed) return next();

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

module.exports = mongoose.model("User", userSchema);
