const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");
const { connectDB, sequelize } = require("../config/db");
const { User, getInstitutionModels } = require("../models");
const { ROLES, INSTITUTIONS } = require("../utils/constants");

dotenv.config();

const ensureUserAssignmentColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("users");

  if (!table.assignedBusNumber) {
    await queryInterface.addColumn("users", "assignedBusNumber", {
      type: DataTypes.STRING(60),
      allowNull: true
    });
    console.log("Migration: added users.assignedBusNumber");
  }

  if (!table.assignedRouteName) {
    await queryInterface.addColumn("users", "assignedRouteName", {
      type: DataTypes.STRING(120),
      allowNull: true
    });
    console.log("Migration: added users.assignedRouteName");
  }
};

const seed = async () => {
  await connectDB();
  await ensureUserAssignmentColumns();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@bus.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const defaultUsers = [
    {
      name: "System Admin",
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
      institution: INSTITUTIONS[0],
      phone: "9999999999"
    },
    {
      name: "Transport Incharge",
      email: process.env.SEED_TRANSPORT_EMAIL || "transport@bus.local",
      password: process.env.SEED_TRANSPORT_PASSWORD || "Transport@123",
      role: ROLES.TRANSPORT,
      institution: INSTITUTIONS[0],
      phone: "9888888888"
    },
    {
      name: "Staff Incharge",
      email: process.env.SEED_STAFF_EMAIL || "staff@bus.local",
      password: process.env.SEED_STAFF_PASSWORD || "Staff@123",
      role: ROLES.STAFF,
      institution: INSTITUTIONS[0],
      phone: "9777777777"
    },
    {
      name: "Driver User",
      email: process.env.SEED_DRIVER_EMAIL || "driver@bus.local",
      password: process.env.SEED_DRIVER_PASSWORD || "Driver@123",
      role: ROLES.DRIVER,
      institution: INSTITUTIONS[0],
      phone: "9666666666"
    },
    {
      name: "Student User",
      email: process.env.SEED_STUDENT_EMAIL || "student@bus.local",
      password: process.env.SEED_STUDENT_PASSWORD || "Student@123",
      role: ROLES.STUDENT,
      institution: INSTITUTIONS[0],
      phone: "9555555555"
    }
  ];

  const institutionUsers = INSTITUTIONS.flatMap((institution, index) => {
    const suffix = index + 1;
    return [
      {
        name: `${institution} Admin`,
        email: `admin${suffix}@bus.local`,
        password: "Admin@123",
        role: ROLES.ADMIN,
        institution,
        phone: `90000000${String(suffix).padStart(2, "0")}`
      },
      {
        name: `${institution} Transport`,
        email: `transport${suffix}@bus.local`,
        password: "Transport@123",
        role: ROLES.TRANSPORT,
        institution,
        phone: `91000000${String(suffix).padStart(2, "0")}`
      },
      {
        name: `${institution} Staff`,
        email: `staff${suffix}@bus.local`,
        password: "Staff@123",
        role: ROLES.STAFF,
        institution,
        phone: `92000000${String(suffix).padStart(2, "0")}`
      },
      {
        name: `${institution} Driver`,
        email: `driver${suffix}@bus.local`,
        password: "Driver@123",
        role: ROLES.DRIVER,
        institution,
        phone: `93000000${String(suffix).padStart(2, "0")}`
      },
      {
        name: `${institution} Student`,
        email: `student${suffix}@bus.local`,
        password: "Student@123",
        role: ROLES.STUDENT,
        institution,
        phone: `94000000${String(suffix).padStart(2, "0")}`
      }
    ];
  });

  defaultUsers.push(...institutionUsers);

  for (const user of defaultUsers) {
    const exists = await User.findOne({ where: { email: user.email } });
    if (exists) {
      if (!exists.institution) {
        await exists.update({ institution: user.institution });
        console.log(`Seed updated: set institution for ${user.email} to ${user.institution}`);
      }
      console.log(`Seed skipped: ${user.role} already exists (${user.email})`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.create({
      name: user.name,
      email: user.email,
      password: passwordHash,
      role: user.role,
      institution: user.institution,
      phone: user.phone
    });
    console.log(`Seed success: created ${user.role} ${user.email}`);
  }

  const busCount = 118;
  const defaultBuses = Array.from({ length: busCount }, (_, index) => {
    const serial = String(index + 1).padStart(4, "0");
    return {
      busNumber: `TN60-${serial}`,
      busName: `Bus ${index + 1}`,
      model: "School Bus",
      institution: INSTITUTIONS[index % INSTITUTIONS.length],
      capacity: 50,
      status: "Active"
    };
  });

  const busesByInstitution = defaultBuses.reduce((accumulator, bus) => {
    if (!accumulator[bus.institution]) accumulator[bus.institution] = [];
    accumulator[bus.institution].push(bus);
    return accumulator;
  }, {});

  for (const [institution, buses] of Object.entries(busesByInstitution)) {
    const { Bus } = getInstitutionModels(institution);
    const busNumbers = buses.map((bus) => bus.busNumber);
    const existingBuses = await Bus.findAll({
      where: { busNumber: busNumbers },
      attributes: ["busNumber"]
    });
    const existingBusNumbers = new Set(existingBuses.map((bus) => bus.busNumber));
    const busesToCreate = buses.filter((bus) => !existingBusNumbers.has(bus.busNumber));

    if (!busesToCreate.length) {
      console.log(`Seed skipped: buses already exist for ${institution}`);
      continue;
    }

    await Bus.bulkCreate(busesToCreate);
    console.log(`Seed success: created ${busesToCreate.length} buses for ${institution}`);
  }

  const totalDrivers = 131;
  const baseDriversPerInstitution = Math.floor(totalDrivers / INSTITUTIONS.length);
  const extraDrivers = totalDrivers % INSTITUTIONS.length;

  let globalDriverIndex = 0;
  const defaultDrivers = INSTITUTIONS.flatMap((institution, institutionIndex) => {
    const targetCount =
      baseDriversPerInstitution + (institutionIndex < extraDrivers ? 1 : 0);
    const institutionBuses = busesByInstitution[institution] || [];

    return Array.from({ length: targetCount }, (_, driverIndex) => {
      globalDriverIndex += 1;
      const globalIndex = globalDriverIndex;
      const serial = String(globalIndex).padStart(4, "0");
      const assignedBus = institutionBuses.length
        ? institutionBuses[driverIndex % institutionBuses.length]
        : null;

      return {
        driverName: `${institution} Driver ${String(driverIndex + 1).padStart(2, "0")}`,
        driverId: `DRV-${serial}`,
        institution,
        phone: `73${String(globalIndex).padStart(8, "0")}`,
        licenseNumber: `DL-TN-${String(2026 + (driverIndex % 3))}-${serial}`,
        experience: `${(driverIndex % 12) + 1} years`,
        assignedBus: assignedBus ? assignedBus.busNumber : null,
        status: driverIndex % 17 === 0 ? "Leave" : driverIndex % 9 === 0 ? "Inactive" : "Active"
      };
    });
  });

  const driversByInstitution = defaultDrivers.reduce((accumulator, driver) => {
    if (!accumulator[driver.institution]) accumulator[driver.institution] = [];
    accumulator[driver.institution].push(driver);
    return accumulator;
  }, {});

  for (const [institution, drivers] of Object.entries(driversByInstitution)) {
    const { Driver, Bus } = getInstitutionModels(institution);
    const driverIds = drivers.map((driver) => driver.driverId);
    const existingDrivers = await Driver.findAll({
      where: { driverId: driverIds },
      attributes: ["driverId"]
    });
    const existingDriverIds = new Set(existingDrivers.map((driver) => driver.driverId));

    const busNumbers = [...new Set(drivers.map((driver) => driver.assignedBus).filter(Boolean))];
    const busRows = await Bus.findAll({
      where: { busNumber: busNumbers },
      attributes: ["id", "busNumber"]
    });
    const busMap = new Map(busRows.map((bus) => [bus.busNumber, bus.id]));

    const driversToCreate = drivers
      .filter((driver) => !existingDriverIds.has(driver.driverId))
      .map((driver) => ({
        ...driver,
        assignedBus: driver.assignedBus ? busMap.get(driver.assignedBus) || null : null
      }));

    if (!driversToCreate.length) {
      console.log(`Seed skipped: drivers already exist for ${institution}`);
      continue;
    }

    await Driver.bulkCreate(driversToCreate);
    console.log(`Seed success: created ${driversToCreate.length} drivers for ${institution}`);
  }

  const destinations = [
    "Kumbum",
    "Andipatti",
    "Thevaram",
    "Theni",
    "Periyakulam",
    "Cumbum",
    "Uthamapalayam",
    "Chinnamanur",
    "Bodinayakanur",
    "Veerapandi",
    "Devaram",
    "Palanichettipatti",
    "Aundipatti",
    "Kadamalai",
    "Kombai",
    "Gudalur",
    "Kamayagoundanpatti",
    "Pannaipuram",
    "Sillamarathupatti",
    "Markayankottai"
  ];
  const stopPool = [
    "Bus Stand",
    "Old Bus Stand",
    "Market",
    "Police Station",
    "Govt Hospital",
    "Railway Gate",
    "Main Road",
    "Collector Office",
    "Bypass",
    "Arch",
    "Temple Stop",
    "School Junction",
    "College Stop",
    "Town Panchayat",
    "Anna Statue",
    "New Market",
    "Court",
    "Signal",
    "Vinayagar Kovil",
    "Water Tank"
  ];

  const routeCount = 200;
  const defaultRoutes = Array.from({ length: routeCount }, (_, index) => {
    const routeNumber = index + 1;
    const routeId = `NSR-${String(routeNumber).padStart(4, "0")}`;
    const institution = INSTITUTIONS[index % INSTITUTIONS.length];
    const destination = destinations[index % destinations.length];
    const stopStart = (index * 3) % stopPool.length;
    const routeStops = [
      `${institution} Gate`,
      `${destination} ${stopPool[stopStart]}`,
      `${destination} ${stopPool[(stopStart + 1) % stopPool.length]}`,
      `${destination} ${stopPool[(stopStart + 2) % stopPool.length]}`,
      `${destination} ${stopPool[(stopStart + 3) % stopPool.length]}`
    ];

    return {
      routeId,
      routeName: `${institution} - ${destination} Route ${String(routeNumber).padStart(3, "0")}`,
      institution,
      startingPoint: institution,
      endingPoint: destination,
      stops: routeStops
    };
  });

  const routesByInstitution = defaultRoutes.reduce((accumulator, route) => {
    if (!accumulator[route.institution]) accumulator[route.institution] = [];
    accumulator[route.institution].push(route);
    return accumulator;
  }, {});

  for (const [institution, routes] of Object.entries(routesByInstitution)) {
    const { Route } = getInstitutionModels(institution);
    const routeIds = routes.map((route) => route.routeId);
    const existingRoutes = await Route.findAll({
      where: { routeId: routeIds },
      attributes: ["routeId"]
    });
    const existingRouteIds = new Set(existingRoutes.map((route) => route.routeId));
    const routesToCreate = routes.filter((route) => !existingRouteIds.has(route.routeId));

    if (!routesToCreate.length) {
      console.log(`Seed skipped: routes already exist for ${institution}`);
      continue;
    }

    await Route.bulkCreate(routesToCreate);
    console.log(`Seed success: created ${routesToCreate.length} routes for ${institution}`);
  }

  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
