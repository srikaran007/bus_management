const asyncHandler = require("../utils/asyncHandler");
const { getInstitutionModels, getRequestModels } = require("../models");
const { INSTITUTIONS, ROLES } = require("../utils/constants");
const { User } = require("../models");

const getInstitutionStats = async (institution, models) => {
  const [totalBuses, activeBuses, totalDrivers, totalStudents, totalRoutes, runningTrips] = await Promise.all([
    models.Bus.count(),
    models.Bus.count({ where: { status: "Active" } }),
    models.Driver.count(),
    models.Student.count(),
    models.Route.count(),
    models.EntryExitLog.count({ where: { status: "Running" } })
  ]);

  return {
    institution,
    totalBuses,
    activeBuses,
    totalDrivers,
    totalStudents,
    totalRoutes,
    runningTrips
  };
};

const summarizeTotals = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      totalBuses: acc.totalBuses + row.totalBuses,
      activeBuses: acc.activeBuses + row.activeBuses,
      totalDrivers: acc.totalDrivers + row.totalDrivers,
      totalStudents: acc.totalStudents + row.totalStudents,
      totalRoutes: acc.totalRoutes + row.totalRoutes,
      runningTrips: acc.runningTrips + row.runningTrips
    }),
    {
      totalBuses: 0,
      activeBuses: 0,
      totalDrivers: 0,
      totalStudents: 0,
      totalRoutes: 0,
      runningTrips: 0
    }
  );

const getDashboardSummary = asyncHandler(async (req, res) => {
  if (req.user?.role === ROLES.ADMIN) {
    const institutionRows = await Promise.all(
      INSTITUTIONS.map((institution) =>
        getInstitutionStats(institution, getInstitutionModels(institution))
      )
    );

    return res.json({
      scope: "all_institutions",
      institution: null,
      totals: summarizeTotals(institutionRows),
      institutions: institutionRows
    });
  }

  const institution = req.user?.institution || "Unknown Institution";
  const row = await getInstitutionStats(institution, getRequestModels(req));
  return res.json({
    scope: "single_institution",
    institution,
    totals: summarizeTotals([row]),
    institutions: [row]
  });
});

const getBusInchargeAssignments = asyncHandler(async (req, res) => {
  const institution = req.user?.institution || null;
  const { Bus } = getRequestModels(req);

  const [buses, staffUsers] = await Promise.all([
    Bus.findAll({ order: [["busNumber", "ASC"]] }),
    User.findAll({
      where: {
        role: ROLES.STAFF,
        ...(institution ? { institution } : {})
      },
      attributes: ["id", "name", "email", "phone", "assignedBusNumber", "institution"],
      order: [["name", "ASC"]]
    })
  ]);

  const staffByBusNumber = new Map(
    staffUsers
      .filter((staff) => staff.assignedBusNumber)
      .map((staff) => [String(staff.assignedBusNumber), staff])
  );

  const items = buses.map((bus) => {
    const busData = bus.toJSON();
    const incharge = staffByBusNumber.get(String(busData.busNumber));
    return {
      id: busData.id,
      busNumber: busData.busNumber,
      busName: busData.busName,
      status: busData.status,
      incharge: incharge
        ? {
            id: incharge.id,
            name: incharge.name,
            email: incharge.email,
            phone: incharge.phone
          }
        : null
    };
  });

  res.json({
    institution,
    items,
    availableStaff: staffUsers.map((staff) => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      assignedBusNumber: staff.assignedBusNumber
    }))
  });
});

const assignBusIncharge = asyncHandler(async (req, res) => {
  const institution = req.user?.institution || null;
  const { Bus } = getRequestModels(req);
  const { staffUserId } = req.body;

  const bus = await Bus.findByPk(req.params.busId);
  if (!bus) {
    return res.status(404).json({ message: "Bus not found" });
  }

  const busNumber = String(bus.busNumber);

  // Ensure only one staff is assigned to this bus.
  await User.update(
    { assignedBusNumber: null, assignedRouteName: null },
    {
      where: {
        role: ROLES.STAFF,
        assignedBusNumber: busNumber,
        ...(institution ? { institution } : {})
      }
    }
  );

  if (staffUserId) {
    const staff = await User.findOne({
      where: {
        id: staffUserId,
        role: ROLES.STAFF,
        ...(institution ? { institution } : {})
      }
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff user not found for this institution" });
    }

    staff.assignedBusNumber = busNumber;
    await staff.save();
  }

  const incharge = await User.findOne({
    where: {
      role: ROLES.STAFF,
      assignedBusNumber: busNumber,
      ...(institution ? { institution } : {})
    },
    attributes: ["id", "name", "email", "phone"]
  });

  res.json({
    message: incharge ? "Bus incharge assigned successfully" : "Bus incharge cleared successfully",
    busId: bus.id,
    busNumber,
    incharge
  });
});

module.exports = { getDashboardSummary, getBusInchargeAssignments, assignBusIncharge };
