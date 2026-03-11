const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");
const { User } = require("../models");
const { ROLES } = require("../utils/constants");

dotenv.config();

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,/]+$/g, "");

const roleAliases = {
  admin: ROLES.ADMIN,
  transport: ROLES.TRANSPORT,
  "transport incharge": ROLES.TRANSPORT,
  staff: ROLES.STAFF,
  student: ROLES.STUDENT,
  driver: ROLES.DRIVER
};

const normalizeRole = (value) => {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,/]+$/g, "");
  return roleAliases[role] || role;
};

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""));

const defaultAccounts = [
  {
    name: "System Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@bus.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
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

const repairUsers = async () => {
  await connectDB();

  const users = await User.findAll();
  let repaired = 0;

  for (const user of users) {
    let changed = false;

    const cleanEmail = normalizeEmail(user.email);
    if (cleanEmail && cleanEmail !== user.email) {
      user.email = cleanEmail;
      changed = true;
    }

    const cleanRole = normalizeRole(user.role);
    if (cleanRole && cleanRole !== user.role) {
      user.role = cleanRole;
      changed = true;
    }

    if (!isBcryptHash(user.password)) {
      user.password = await bcrypt.hash(String(user.password || "").trim(), 10);
      changed = true;
    }

    if (changed) {
      await user.save();
      repaired += 1;
    }
  }

  for (const account of defaultAccounts) {
    const email = normalizeEmail(account.email);
    const hash = await bcrypt.hash(account.password, 10);

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      await existing.update({
        name: account.name,
        email,
        role: account.role,
        phone: account.phone,
        password: hash
      });
    } else {
      await User.create({
        name: account.name,
        email,
        role: account.role,
        phone: account.phone,
        password: hash
      });
    }
  }

  console.log(`User repair completed. Repaired records: ${repaired}`);
  console.log("Role login accounts reset to .env seed credentials.");
  process.exit(0);
};

repairUsers().catch((error) => {
  console.error("User repair failed:", error.message);
  process.exit(1);
});
