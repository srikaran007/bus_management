const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { INSTITUTIONS } = require("../utils/constants");

const INSTITUTION_TABLE_SUFFIXES = {
  "N.S Eng Clg": "ns_eng_clg",
  "N.S Arts Clg": "ns_arts_clg",
  "N.S Matric School": "ns_matric_school",
  "N.S Public School": "ns_public_school",
  "Vidyalaya School": "vidyalaya_school",
  "BEd Clg": "bed_clg"
};

const withLegacyIdAlias = {
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return String(this.getDataValue("id"));
    }
  }
};

const defineModel = (name, attributes, options = {}) => {
  const existing = sequelize.models[name];
  if (existing) {
    return existing;
  }

  return sequelize.define(name, attributes, options);
};

const buildTableName = (baseTableName, institution) => {
  const suffix = INSTITUTION_TABLE_SUFFIXES[institution];
  return suffix ? `${baseTableName}_${suffix}` : baseTableName;
};

const getOperationalModelName = (baseName, institution) => {
  const suffix = INSTITUTION_TABLE_SUFFIXES[institution];
  if (!suffix) return baseName;

  return `${baseName}_${suffix}`
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
};

const userAttributes = {
  ...withLegacyIdAlias,
  name: { type: DataTypes.STRING(80), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(30), allowNull: false },
  institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  assignedBusNumber: { type: DataTypes.STRING(60), allowNull: true },
  assignedRouteName: { type: DataTypes.STRING(120), allowNull: true },
  refreshTokenHash: { type: DataTypes.STRING(255), allowNull: true },
  resetPasswordTokenHash: { type: DataTypes.STRING(255), allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
};

const userHooks = {
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
};

const createOperationalAttributes = {
  bus: () => ({
    ...withLegacyIdAlias,
    busNumber: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    busName: { type: DataTypes.STRING(120), allowNull: false },
    model: { type: DataTypes.STRING(120), allowNull: true },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("Active", "Maintenance", "Idle"), allowNull: false, defaultValue: "Active" }
  }),
  driver: () => ({
    ...withLegacyIdAlias,
    driverName: { type: DataTypes.STRING(120), allowNull: false },
    driverId: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    licenseNumber: { type: DataTypes.STRING(120), allowNull: false },
    experience: { type: DataTypes.STRING(80), allowNull: true },
    assignedBus: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM("Active", "Inactive", "Leave"), allowNull: false, defaultValue: "Active" }
  }),
  student: () => ({
    ...withLegacyIdAlias,
    studentName: { type: DataTypes.STRING(120), allowNull: false },
    registerNumber: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    department: { type: DataTypes.STRING(120), allowNull: true },
    busNumber: { type: DataTypes.STRING(60), allowNull: true },
    routeName: { type: DataTypes.STRING(120), allowNull: true },
    boardingPoint: { type: DataTypes.STRING(120), allowNull: true },
    user: { type: DataTypes.INTEGER, allowNull: true }
  }),
  route: () => ({
    ...withLegacyIdAlias,
    routeId: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    routeName: { type: DataTypes.STRING(120), allowNull: false },
    startingPoint: { type: DataTypes.STRING(120), allowNull: false },
    endingPoint: { type: DataTypes.STRING(120), allowNull: false },
    stops: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    assignedBus: { type: DataTypes.INTEGER, allowNull: true }
  }),
  attendance: () => ({
    ...withLegacyIdAlias,
    date: { type: DataTypes.DATE, allowNull: false },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    attendanceType: { type: DataTypes.ENUM("Morning", "Evening"), allowNull: false },
    subjectType: { type: DataTypes.ENUM("Driver", "Student"), allowNull: false },
    subjectId: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.ENUM("Present", "Absent", "Leave"), allowNull: false },
    markedBy: { type: DataTypes.INTEGER, allowNull: true }
  }),
  entryExitLog: () => ({
    ...withLegacyIdAlias,
    busNumber: { type: DataTypes.STRING(60), allowNull: false },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    driverName: { type: DataTypes.STRING(120), allowNull: false },
    route: { type: DataTypes.STRING(120), allowNull: false },
    entryTime: { type: DataTypes.DATE, allowNull: false },
    exitTime: { type: DataTypes.DATE, allowNull: true },
    entryLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    entryLongitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    exitLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    exitLongitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    lastTrackedLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    lastTrackedLongitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    totalDistanceKm: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalDriveMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    monitoringMethod: {
      type: DataTypes.ENUM("Manual", "GPS", "BusGPSAuto"),
      allowNull: false,
      defaultValue: "Manual"
    },
    submittedBy: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM("Running", "Completed"), allowNull: false, defaultValue: "Running" }
  }),
  driverShift: () => ({
    ...withLegacyIdAlias,
    scheduleDate: { type: DataTypes.DATEONLY, allowNull: false },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
    routeId: { type: DataTypes.INTEGER, allowNull: true },
    routeName: { type: DataTypes.STRING(120), allowNull: false },
    busId: { type: DataTypes.INTEGER, allowNull: true },
    busNumber: { type: DataTypes.STRING(60), allowNull: true },
    primaryDriverId: { type: DataTypes.INTEGER, allowNull: false },
    primaryDriverCode: { type: DataTypes.STRING(60), allowNull: true },
    spareDriverId: { type: DataTypes.INTEGER, allowNull: true },
    spareDriverCode: { type: DataTypes.STRING(60), allowNull: true },
    predictedReliability: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    predictedRisk: { type: DataTypes.ENUM("Low", "Medium", "High"), allowNull: false, defaultValue: "Medium" },
    status: { type: DataTypes.ENUM("Planned", "InProgress", "Completed", "Cancelled"), allowNull: false, defaultValue: "Planned" },
    notes: { type: DataTypes.STRING(255), allowNull: true }
  })
};

const User = defineModel("User", userAttributes, {
  tableName: "users",
  timestamps: true,
  hooks: userHooks
});

const AuditLog = defineModel(
  "AuditLog",
  {
    ...withLegacyIdAlias,
    requestId: { type: DataTypes.STRING(120), allowNull: true },
    institution: { type: DataTypes.ENUM(...INSTITUTIONS), allowNull: true },
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

const createOperationalModels = (institution = null) => {
  const modelOptions = (baseTableName) => ({
    tableName: buildTableName(baseTableName, institution),
    timestamps: true
  });

  const Bus = defineModel(
    getOperationalModelName("Bus", institution),
    createOperationalAttributes.bus(),
    modelOptions("buses")
  );
  const Driver = defineModel(
    getOperationalModelName("Driver", institution),
    createOperationalAttributes.driver(),
    modelOptions("drivers")
  );
  const Student = defineModel(
    getOperationalModelName("Student", institution),
    createOperationalAttributes.student(),
    modelOptions("students")
  );
  const Route = defineModel(
    getOperationalModelName("Route", institution),
    createOperationalAttributes.route(),
    modelOptions("routes")
  );
  const Attendance = defineModel(
    getOperationalModelName("Attendance", institution),
    createOperationalAttributes.attendance(),
    modelOptions("attendance")
  );
  const EntryExitLog = defineModel(
    getOperationalModelName("EntryExitLog", institution),
    createOperationalAttributes.entryExitLog(),
    modelOptions("entry_exit_logs")
  );
  const DriverShift = defineModel(
    getOperationalModelName("DriverShift", institution),
    createOperationalAttributes.driverShift(),
    {
      ...modelOptions("driver_shifts"),
      indexes: [
        {
          unique: true,
          fields: ["scheduleDate", "routeId"]
        }
      ]
    }
  );

  Driver.belongsTo(Bus, { as: "assignedBusDetails", foreignKey: "assignedBus" });
  Route.belongsTo(Bus, { as: "assignedBusDetails", foreignKey: "assignedBus" });
  Student.belongsTo(User, { as: "userDetails", foreignKey: "user" });
  Attendance.belongsTo(User, { as: "markedByUser", foreignKey: "markedBy" });
  EntryExitLog.belongsTo(User, { as: "submittedByUser", foreignKey: "submittedBy" });
  DriverShift.belongsTo(Route, { as: "routeDetails", foreignKey: "routeId" });
  DriverShift.belongsTo(Bus, { as: "busDetails", foreignKey: "busId" });
  DriverShift.belongsTo(Driver, { as: "primaryDriverDetails", foreignKey: "primaryDriverId" });
  DriverShift.belongsTo(Driver, { as: "spareDriverDetails", foreignKey: "spareDriverId" });

  return { Bus, Driver, Student, Route, Attendance, EntryExitLog, DriverShift };
};

const sharedOperationalModels = createOperationalModels();
const institutionOperationalModels = Object.fromEntries(
  INSTITUTIONS.map((institution) => [institution, createOperationalModels(institution)])
);

AuditLog.belongsTo(User, { as: "userDetails", foreignKey: "user" });

const getInstitutionModels = (institution) =>
  institutionOperationalModels[institution] || sharedOperationalModels;

const getRequestModels = (req) => getInstitutionModels(req?.user?.institution || null);

module.exports = {
  User,
  AuditLog,
  ...sharedOperationalModels,
  getInstitutionModels,
  getRequestModels,
  institutionOperationalModels,
  INSTITUTION_TABLE_SUFFIXES
};
