const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Keep `_id` as a virtual alias for frontend compatibility during MySQL-only operation.
const withLegacyIdAlias = {
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return String(this.getDataValue("id"));
    }
  }
};

const User = sequelize.define(
  "User",
  {
    ...withLegacyIdAlias,
    name: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(30), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    refreshTokenHash: { type: DataTypes.STRING(255), allowNull: true },
    resetPasswordTokenHash: { type: DataTypes.STRING(255), allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = String(user.email).trim().toLowerCase().replace(/[,/]+$/g, "");
        }
        if (user.role) {
          user.role = String(user.role).trim().toLowerCase().replace(/[,/]+$/g, "");
        }
      },
      beforeSave: async (user) => {
        if (!user.changed("password")) return;
        const isAlreadyHashed = /^\$2[aby]\$\d{2}\$/.test(user.password || "");
        if (isAlreadyHashed) return;
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
);

const Bus = sequelize.define(
  "Bus",
  {
    ...withLegacyIdAlias,
    busNumber: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    busName: { type: DataTypes.STRING(120), allowNull: false },
    model: { type: DataTypes.STRING(120), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    routeName: { type: DataTypes.STRING(120), allowNull: true },
    startingPoint: { type: DataTypes.STRING(120), allowNull: true },
    endingPoint: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.ENUM("Active", "Maintenance", "Idle"), allowNull: false, defaultValue: "Active" },
    driver: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: "buses", timestamps: true }
);

const Driver = sequelize.define(
  "Driver",
  {
    ...withLegacyIdAlias,
    driverName: { type: DataTypes.STRING(120), allowNull: false },
    driverId: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    licenseNumber: { type: DataTypes.STRING(120), allowNull: false },
    experience: { type: DataTypes.STRING(80), allowNull: true },
    assignedBus: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM("Active", "Inactive", "Leave"), allowNull: false, defaultValue: "Active" }
  },
  { tableName: "drivers", timestamps: true }
);

const Student = sequelize.define(
  "Student",
  {
    ...withLegacyIdAlias,
    studentName: { type: DataTypes.STRING(120), allowNull: false },
    registerNumber: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    department: { type: DataTypes.STRING(120), allowNull: true },
    busNumber: { type: DataTypes.STRING(60), allowNull: true },
    routeName: { type: DataTypes.STRING(120), allowNull: true },
    boardingPoint: { type: DataTypes.STRING(120), allowNull: true },
    user: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: "students", timestamps: true }
);

const Route = sequelize.define(
  "Route",
  {
    ...withLegacyIdAlias,
    routeId: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    routeName: { type: DataTypes.STRING(120), allowNull: false },
    startingPoint: { type: DataTypes.STRING(120), allowNull: false },
    endingPoint: { type: DataTypes.STRING(120), allowNull: false },
    stops: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    assignedBus: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: "routes", timestamps: true }
);

const Attendance = sequelize.define(
  "Attendance",
  {
    ...withLegacyIdAlias,
    date: { type: DataTypes.DATE, allowNull: false },
    attendanceType: { type: DataTypes.ENUM("Morning", "Evening"), allowNull: false },
    subjectType: { type: DataTypes.ENUM("Driver", "Student"), allowNull: false },
    subjectId: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.ENUM("Present", "Absent", "Leave"), allowNull: false },
    markedBy: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: "attendance", timestamps: true }
);

const EntryExitLog = sequelize.define(
  "EntryExitLog",
  {
    ...withLegacyIdAlias,
    busNumber: { type: DataTypes.STRING(60), allowNull: false },
    driverName: { type: DataTypes.STRING(120), allowNull: false },
    route: { type: DataTypes.STRING(120), allowNull: false },
    entryTime: { type: DataTypes.DATE, allowNull: false },
    exitTime: { type: DataTypes.DATE, allowNull: true },
    submittedBy: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM("Running", "Completed"), allowNull: false, defaultValue: "Running" }
  },
  { tableName: "entry_exit_logs", timestamps: true }
);

const AuditLog = sequelize.define(
  "AuditLog",
  {
    ...withLegacyIdAlias,
    requestId: { type: DataTypes.STRING(120), allowNull: true },
    user: { type: DataTypes.INTEGER, allowNull: true },
    role: { type: DataTypes.STRING(40), allowNull: true },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.STRING(255), allowNull: false },
    statusCode: { type: DataTypes.INTEGER, allowNull: false },
    durationMs: { type: DataTypes.INTEGER, allowNull: false },
    ip: { type: DataTypes.STRING(120), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    requestBody: { type: DataTypes.JSON, allowNull: true },
    query: { type: DataTypes.JSON, allowNull: true }
  },
  { tableName: "audit_logs", timestamps: true }
);

Bus.belongsTo(Driver, { as: "driverDetails", foreignKey: "driver" });
Driver.belongsTo(Bus, { as: "assignedBusDetails", foreignKey: "assignedBus" });
Route.belongsTo(Bus, { as: "assignedBusDetails", foreignKey: "assignedBus" });
Student.belongsTo(User, { as: "userDetails", foreignKey: "user" });
Attendance.belongsTo(User, { as: "markedByUser", foreignKey: "markedBy" });
EntryExitLog.belongsTo(User, { as: "submittedByUser", foreignKey: "submittedBy" });
AuditLog.belongsTo(User, { as: "userDetails", foreignKey: "user" });

module.exports = {
  User,
  Bus,
  Driver,
  Student,
  Route,
  Attendance,
  EntryExitLog,
  AuditLog
};
