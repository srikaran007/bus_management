const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");
const { User } = require("../models");
const { ROLES } = require("../utils/constants");

dotenv.config();

const seed = async () => {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@bus.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const defaultUsers = [
    {
      name: "System Admin",
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
      phone: "9999999999"
    },
    {
      name: "Transport Incharge",
      email: process.env.SEED_TRANSPORT_EMAIL || "transport@bus.local",
      password: process.env.SEED_TRANSPORT_PASSWORD || "Transport@123",
      role: ROLES.TRANSPORT,
      phone: "9888888888"
    },
    {
      name: "Staff Incharge",
      email: process.env.SEED_STAFF_EMAIL || "staff@bus.local",
      password: process.env.SEED_STAFF_PASSWORD || "Staff@123",
      role: ROLES.STAFF,
      phone: "9777777777"
    },
    {
      name: "Driver User",
      email: process.env.SEED_DRIVER_EMAIL || "driver@bus.local",
      password: process.env.SEED_DRIVER_PASSWORD || "Driver@123",
      role: ROLES.DRIVER,
      phone: "9666666666"
    },
    {
      name: "Student User",
      email: process.env.SEED_STUDENT_EMAIL || "student@bus.local",
      password: process.env.SEED_STUDENT_PASSWORD || "Student@123",
      role: ROLES.STUDENT,
      phone: "9555555555"
    }
  ];

  for (const user of defaultUsers) {
    const exists = await User.findOne({ where: { email: user.email } });
    if (exists) {
      console.log(`Seed skipped: ${user.role} already exists (${user.email})`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.create({
      name: user.name,
      email: user.email,
      password: passwordHash,
      role: user.role,
      phone: user.phone
    });
    console.log(`Seed success: created ${user.role} ${user.email}`);
  }

  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
