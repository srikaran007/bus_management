const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { getInstitutionModels } = require("../models");
const { ROLES, INSTITUTIONS } = require("../utils/constants");
const { postToMlService } = require("../services/pythonMlClient");
const { Op } = require("sequelize");
const { createPaginationOptions, getPaginationMeta } = require("../utils/queryFeatures");

const toDateOnly = (value) => new Date(value).toISOString().slice(0, 10);
const normalizeText = (value) => String(value || "").trim().toLowerCase();
const toDateRangeUtc = (dateText) => ({
  start: new Date(`${dateText}T00:00:00.000Z`),
  end: new Date(`${dateText}T23:59:59.999Z`)
});

const getRecentWindow = (lookbackDays = 30) => {
  const days = Math.max(1, Number(lookbackDays) || 30);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);
  return { from, days };
};

const resolveRequestedInstitution = (req, payload = {}) => {
  if (req.user?.role !== ROLES.ADMIN) {
    return req.user?.institution || null;
  }

  const requestedInstitution = payload.institution || req.query.institution || null;
  if (!requestedInstitution) {
    throw new AppError("Institution is required for admin ML operations", 400);
  }

  if (!INSTITUTIONS.includes(requestedInstitution)) {
    throw new AppError("Invalid institution for ML operations", 400);
  }

  return requestedInstitution;
};

const fetchPerformanceData = async ({ Driver, Attendance, EntryExitLog, lookbackDays }) => {
  const { from, days } = getRecentWindow(lookbackDays);

  const [drivers, attendanceRows, entryExitRows] = await Promise.all([
    Driver.findAll({ where: { status: { [Op.in]: ["Active", "Inactive", "Leave"] } } }),
    Attendance.findAll({ where: { date: { [Op.gte]: from } } }),
    EntryExitLog.findAll({ where: { createdAt: { [Op.gte]: from } } })
  ]);

  return {
    lookbackDays: days,
    drivers: drivers.map((entry) => entry.toJSON()),
    attendance: attendanceRows.map((entry) => entry.toJSON()),
    entryExitLogs: entryExitRows.map((entry) => entry.toJSON())
  };
};

const buildWorkloadMap = (entryExitRows) => {
  const map = new Map();
  for (const row of entryExitRows) {
    const key = normalizeText(row.driverName);
    const previous = map.get(key) || { totalDistanceKm: 0, totalDriveMinutes: 0, totalTrips: 0 };
    const fallbackMinutes =
      row.entryTime && row.exitTime
        ? Math.max(
            0,
            Math.round((new Date(row.exitTime).getTime() - new Date(row.entryTime).getTime()) / 60000)
          )
        : 0;

    previous.totalDistanceKm += Number(row.totalDistanceKm || 0);
    previous.totalDriveMinutes += Number(row.totalDriveMinutes || fallbackMinutes || 0);
    previous.totalTrips += 1;
    map.set(key, previous);
  }
  return map;
};

const pickLeastWorkCandidate = ({ candidates, excludeDriverIds = new Set(), workloadMap }) => {
  const eligible = candidates
    .filter((candidate) => !excludeDriverIds.has(String(candidate.driverId)))
    .map((candidate) => {
      const workload = workloadMap.get(normalizeText(candidate.driverName)) || {
        totalDistanceKm: 0,
        totalDriveMinutes: 0,
        totalTrips: 0
      };
      return { candidate, workload };
    })
    .sort((a, b) => {
      if (a.workload.totalDistanceKm !== b.workload.totalDistanceKm) {
        return a.workload.totalDistanceKm - b.workload.totalDistanceKm;
      }
      if (a.workload.totalDriveMinutes !== b.workload.totalDriveMinutes) {
        return a.workload.totalDriveMinutes - b.workload.totalDriveMinutes;
      }
      if (a.workload.totalTrips !== b.workload.totalTrips) {
        return a.workload.totalTrips - b.workload.totalTrips;
      }
      return Number(b.candidate.predictedReliability || 0) - Number(a.candidate.predictedReliability || 0);
    });

  return eligible[0]?.candidate || null;
};

const getDriverPerformance = asyncHandler(async (req, res) => {
  const institution = resolveRequestedInstitution(req);
  const { Driver, Attendance, EntryExitLog } = getInstitutionModels(institution);
  const lookbackDays = Number(req.query.lookbackDays || 30);
  const performancePayload = await fetchPerformanceData({ Driver, Attendance, EntryExitLog, lookbackDays });
  const response = await postToMlService("/driver-performance", performancePayload);
  res.json({ ...response, institution });
});

const generateDriverSchedule = asyncHandler(async (req, res) => {
  const institution = resolveRequestedInstitution(req, req.body);
  const { DriverShift, Route, Bus, Driver, Attendance, EntryExitLog } = getInstitutionModels(institution);
  const lookbackDays = Number(req.body.lookbackDays || 30);
  const scheduleDate = toDateOnly(req.body.scheduleDate || new Date());
  const overwrite = Boolean(req.body.overwrite);

  const [performancePayload, routes] = await Promise.all([
    fetchPerformanceData({ Driver, Attendance, EntryExitLog, lookbackDays }),
    Route.findAll({
      include: [{ model: Bus, as: "assignedBusDetails", required: false }],
      order: [["routeName", "ASC"]]
    })
  ]);

  if (!routes.length) {
    throw new AppError("No routes found to schedule drivers", 400);
  }

  const performanceResponse = await postToMlService("/driver-performance", performancePayload);
  const scheduleResponse = await postToMlService("/driver-schedule-plan", {
    routes: routes.map((route) => route.toJSON()),
    driverPerformance: performanceResponse.items || [],
    scheduleDate
  });
  const plan = scheduleResponse.items || [];

  const { start, end } = toDateRangeUtc(scheduleDate);
  const [dailyEntryExitRows, absentRows] = await Promise.all([
    EntryExitLog.findAll({
      where: { entryTime: { [Op.between]: [start, end] } }
    }),
    Attendance.findAll({
      where: {
        date: { [Op.between]: [start, end] },
        subjectType: "Driver",
        status: "Absent"
      }
    })
  ]);

  const dailyWorkloadMap = buildWorkloadMap(dailyEntryExitRows.map((row) => row.toJSON()));
  const absentDriverCodes = new Set(absentRows.map((row) => normalizeText(row.subjectId)));
  const activePool = (performanceResponse.items || []).filter(
    (item) => item.status === "Active" && !absentDriverCodes.has(normalizeText(item.driverCode))
  );
  const performanceById = new Map((performanceResponse.items || []).map((item) => [String(item.driverId), item]));
  const usedPrimaryDriverIds = new Set();

  const workloadAwarePlan = plan
    .map((assignment) => {
      const updated = { ...assignment };
      let primary = performanceById.get(String(updated.primaryDriverId)) || null;
      const primaryUnavailable =
        !primary || absentDriverCodes.has(normalizeText(primary.driverCode));

      if (primaryUnavailable) {
        primary = pickLeastWorkCandidate({
          candidates: activePool,
          excludeDriverIds: usedPrimaryDriverIds,
          workloadMap: dailyWorkloadMap
        });
      }

      if (!primary) {
        return null;
      }

      updated.primaryDriverId = primary.driverId;
      updated.primaryDriverCode = primary.driverCode;
      updated.predictedReliability = primary.predictedReliability;
      updated.predictedRisk = primary.predictedRisk;
      usedPrimaryDriverIds.add(String(primary.driverId));

      const spare = pickLeastWorkCandidate({
        candidates: activePool,
        excludeDriverIds: new Set([String(primary.driverId)]),
        workloadMap: dailyWorkloadMap
      });

      if (spare) {
        updated.spareDriverId = spare.driverId;
        updated.spareDriverCode = spare.driverCode;
        const spareLoad = dailyWorkloadMap.get(normalizeText(spare.driverName)) || {
          totalDistanceKm: 0,
          totalDriveMinutes: 0
        };
        updated.notes = `Spare selected by least workload: ${spare.driverName} (${Number(
          spareLoad.totalDistanceKm || 0
        ).toFixed(2)} km today, ${Number(spareLoad.totalDriveMinutes || 0)} min)`;
      } else {
        updated.spareDriverId = null;
        updated.spareDriverCode = null;
      }

      return updated;
    })
    .filter(Boolean);

  if (!workloadAwarePlan.length) {
    throw new AppError("No active drivers available to create a schedule", 400);
  }

  if (overwrite) {
    await DriverShift.destroy({
      where: { scheduleDate }
    });
  }

  const created = [];
  for (const assignment of workloadAwarePlan) {
    // Upsert by date + route to keep schedule generation idempotent.
    const [record] = await DriverShift.findOrCreate({
      where: {
        scheduleDate: assignment.scheduleDate,
        routeId: assignment.routeId
      },
      defaults: assignment
    });

    if (overwrite) {
      await record.update(assignment);
    }

    created.push(record);
  }

  res.status(201).json({
    institution,
    scheduleDate,
    lookbackDays,
    totalAssignments: created.length,
    items: created
  });
});

const getDriverSchedule = asyncHandler(async (req, res) => {
  const institution = resolveRequestedInstitution(req);
  const { DriverShift, Route, Bus, Driver } = getInstitutionModels(institution);
  const scheduleDate = req.query.scheduleDate ? toDateOnly(req.query.scheduleDate) : null;
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "scheduleDate,-createdAt"
  });

  const where = {};
  if (scheduleDate) {
    where.scheduleDate = scheduleDate;
  }

  const include = [
    { model: Route, as: "routeDetails", required: false },
    { model: Bus, as: "busDetails", required: false },
    { model: Driver, as: "primaryDriverDetails", required: false },
    { model: Driver, as: "spareDriverDetails", required: false }
  ];

  const { rows, count } = await DriverShift.findAndCountAll({ where, include, order, offset, limit });

  res.json({
    institution,
    items: rows,
    pagination: getPaginationMeta(count, page, limit)
  });
});

const updateDriverShiftStatus = asyncHandler(async (req, res) => {
  const institution = resolveRequestedInstitution(req, req.body);
  const { DriverShift } = getInstitutionModels(institution);
  const shift = await DriverShift.findByPk(req.params.id);
  if (!shift) {
    throw new AppError("Driver shift not found", 404);
  }

  await shift.update({
    status: req.body.status,
    notes: req.body.notes ?? shift.notes
  });

  res.json({ ...shift.toJSON(), institution });
});

const getSpareDriverRecommendations = asyncHandler(async (req, res) => {
  const institution = resolveRequestedInstitution(req);
  const { Driver, Attendance, EntryExitLog } = getInstitutionModels(institution);
  const lookbackDays = Number(req.query.lookbackDays || 30);
  const limit = Number(req.query.limit || 5);

  const performancePayload = await fetchPerformanceData({ Driver, Attendance, EntryExitLog, lookbackDays });
  const performanceResponse = await postToMlService("/driver-performance", performancePayload);
  const recommendationResponse = await postToMlService("/driver-spares", {
    lookbackDays: performancePayload.lookbackDays,
    limit,
    driverPerformance: performanceResponse.items || []
  });
  const today = toDateOnly(new Date());
  const { start, end } = toDateRangeUtc(today);
  const workloadRows = await EntryExitLog.findAll({
    where: { entryTime: { [Op.between]: [start, end] } }
  });
  const workloadMap = buildWorkloadMap(workloadRows.map((row) => row.toJSON()));

  const items = (recommendationResponse.items || [])
    .map((item) => {
      const workload = workloadMap.get(normalizeText(item.driverName)) || {
        totalDistanceKm: 0,
        totalDriveMinutes: 0,
        totalTrips: 0
      };
      return {
        ...item,
        workload
      };
    })
    .sort((a, b) => {
      if (a.workload.totalDistanceKm !== b.workload.totalDistanceKm) {
        return a.workload.totalDistanceKm - b.workload.totalDistanceKm;
      }
      if (a.workload.totalDriveMinutes !== b.workload.totalDriveMinutes) {
        return a.workload.totalDriveMinutes - b.workload.totalDriveMinutes;
      }
      return Number(b.predictedReliability || 0) - Number(a.predictedReliability || 0);
    })
    .slice(0, limit);

  res.json({
    ...recommendationResponse,
    institution,
    workloadDate: today,
    items
  });
});

module.exports = {
  getDriverPerformance,
  generateDriverSchedule,
  getDriverSchedule,
  updateDriverShiftStatus,
  getSpareDriverRecommendations
};
