const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createUserWithToken = async ({
  name = "Test User",
  email = `user_${Date.now()}@test.com`,
  password = "Test@123",
  role = "admin",
  phone = "9876543210"
} = {}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    phone
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { user, token };
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { createUserWithToken, authHeader };
