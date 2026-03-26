const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { User } = require("../models");
const { INSTITUTIONS } = require("../utils/constants");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const accessSecret = process.env.JWT_SECRET || "dev_secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,/]+$/g, "");

const signAccessToken = (id) =>
  jwt.sign({ id }, accessSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m"
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
  });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution,
  phone: user.phone,
  assignedBusNumber: user.assignedBusNumber,
  assignedRouteName: user.assignedRouteName
});

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();
  return { accessToken, refreshToken };
};

const register = asyncHandler(async (req, res) => {
  const { name, password, role, phone, assignedBusNumber, assignedRouteName } = req.body;
  const email = normalizeEmail(req.body.email);
  const creatorInstitution = req.user?.institution || null;
  const institution = creatorInstitution || req.body.institution || null;

  if (!institution || !INSTITUTIONS.includes(institution)) {
    throw new AppError("Valid institution is required for user registration", 400);
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    throw new AppError("Email already exists", 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    institution,
    phone,
    assignedBusNumber,
    assignedRouteName
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  res.status(201).json({
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  });
});

const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isHashed = /^\$2[aby]\$\d{2}\$/.test(user.password);
  const isMatch = isHashed ? await bcrypt.compare(password, user.password) : password === user.password;
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!isHashed) {
    user.password = password;
    await user.save();
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const decoded = jwt.verify(token, refreshSecret);

  const user = await User.findByPk(decoded.id);
  if (!user || !user.refreshTokenHash) {
    throw new AppError("Invalid refresh token", 401);
  }

  const valid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!valid) {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokens = await issueTokens(user);
  res.json({ ...tokens, user: sanitizeUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = null;
    await req.user.save();
  }
  res.json({ message: "Logged out successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError("User with this email not found", 404);
  }

  const resetTokenRaw = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetTokenRaw).digest("hex");

  user.resetPasswordTokenHash = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  res.json({
    message: "Reset token generated (send via email service in production)",
    resetToken: resetTokenRaw
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    where: {
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    throw new AppError("Reset token is invalid or expired", 400);
  }

  user.password = password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  user.refreshTokenHash = null;
  await user.save();

  res.json({ message: "Password reset successful" });
});

const me = asyncHandler(async (req, res) => res.json(sanitizeUser(req.user)));

module.exports = {
  register,
  login,
  me,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
};
