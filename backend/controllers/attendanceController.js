const { User, getRequestModels } = require("../models");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { ROLES } = require("../utils/constants");
const { institutionFilter, withInstitution } = require("../utils/institutionScope");
const {
  Op,
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

const getCampusGeofence = () => {
  const lat = Number(process.env.CAMPUS_GEOFENCE_CENTER_LAT);
  const lng = Number(process.env.CAMPUS_GEOFENCE_CENTER_LNG);
  const radiusMeters = Number(process.env.CAMPUS_GEOFENCE_RADIUS_METERS || 300);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError(
      "Campus geofence is not configured. Set CAMPUS_GEOFENCE_CENTER_LAT and CAMPUS_GEOFENCE_CENTER_LNG.",
      500
    );
  }

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new AppError("Invalid CAMPUS_GEOFENCE_RADIUS_METERS configuration.", 500);
  }

  return { lat, lng, radiusMeters };
};

const updateRunningTripMetrics = (runningLog, latitude, longitude, capturedAt) => {
  const previousLat = Number(runningLog.lastTrackedLatitude ?? runningLog.entryLatitude);
  const previousLng = Number(runningLog.lastTrackedLongitude ?? runningLog.entryLongitude);

  if (Number.isFinite(previousLat) && Number.isFinite(previousLng)) {
    const segmentMeters = haversineDistanceMeters(previousLat, previousLng, latitude, longitude);
    const segmentKm = segmentMeters / 1000;
    // Ignore GPS outliers caused by sudden jumps in device signal.
    if (Number.isFinite(segmentKm) && segmentKm >= 0 && segmentKm <= 8) {
      runningLog.totalDistanceKm = Number(runningLog.totalDistanceKm || 0) + segmentKm;
    }
  }

  runningLog.lastTrackedLatitude = latitude;
  runningLog.lastTrackedLongitude = longitude;
  if (runningLog.entryTime && capturedAt) {
    const elapsedMs = new Date(capturedAt).getTime() - new Date(runningLog.entryTime).getTime();
    runningLog.totalDriveMinutes = Math.max(0, Math.round(elapsedMs / 60000));
  }
};

const serializeAttendance = (entry) => {
  const data = entry.toJSON();
  if (data.markedByUser) {
    data.markedBy = data.markedByUser;
    delete data.markedByUser;
  }
  return data;
};

const getAttendance = asyncHandler(async (req, res) => {
  const { Attendance } = getRequestModels(req);
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    if (req.query.from && req.query.to) {
      dateFilter.date = { [Op.between]: [new Date(req.query.from), new Date(req.query.to)] };
    } else if (req.query.from) {
      dateFilter.date = { [Op.gte]: new Date(req.query.from) };
    } else if (req.query.to) {
      dateFilter.date = { [Op.lte]: new Date(req.query.to) };
    }
  } else if (req.query.date) {
    dateFilter.date = new Date(req.query.date);
  }

  const subjectTypeFilter = req.query.subjectType ? { subjectType: req.query.subjectType } : {};
  const subjectIdFilter = req.query.subjectId ? { subjectId: req.query.subjectId } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["subjectId", "status"]);
  const where = mergeFilters(
    dateFilter,
    subjectTypeFilter,
    subjectIdFilter,
    statusFilter,
    searchFilter,
    institutionFilter(req)
  );

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    include: [{ model: User, as: "markedByUser", attributes: ["id", "name", "role"] }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeAttendance),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const markAttendance = asyncHandler(async (req, res) => {
  const { Attendance } = getRequestModels(req);
  if (req.user.role === ROLES.DRIVER && req.body.subjectType !== "Driver") {
    throw new AppError("Drivers can only submit driver attendance", 403);
  }

  if (req.user.role === ROLES.STAFF && req.body.subjectType !== "Student") {
    throw new AppError("Staff can only submit student attendance", 403);
  }

  const payload = withInstitution(req, req.body);
  if (req.user) payload.markedBy = req.user.id;

  const record = await Attendance.create(payload);
  res.status(201).json(record);
});

const getEntryExitLogs = asyncHandler(async (req, res) => {
  const { EntryExitLog } = getRequestModels(req);
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const busFilter = req.query.busNumber ? { busNumber: req.query.busNumber } : {};
  const routeFilter = req.query.route ? { route: req.query.route } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["busNumber", "driverName", "route", "status"]);

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    if (req.query.from && req.query.to) {
      dateFilter.createdAt = { [Op.between]: [new Date(req.query.from), new Date(req.query.to)] };
    } else if (req.query.from) {
      dateFilter.createdAt = { [Op.gte]: new Date(req.query.from) };
    } else if (req.query.to) {
      dateFilter.createdAt = { [Op.lte]: new Date(req.query.to) };
    }
  }

  const where = mergeFilters(busFilter, routeFilter, statusFilter, searchFilter, dateFilter, institutionFilter(req));
  const { rows, count } = await EntryExitLog.findAndCountAll({
    where,
    order,
    offset,
    limit
  });

  res.json({
    items: rows,
    pagination: getPaginationMeta(count, page, limit)
  });
});

const getDriverWorkload = asyncHandler(async (req, res) => {
  const { EntryExitLog } = getRequestModels(req);
  const dateText = String(req.query.date || new Date().toISOString().slice(0, 10));
  const start = new Date(`${dateText}T00:00:00.000Z`);
  const end = new Date(`${dateText}T23:59:59.999Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400);
  }

  const where = mergeFilters(
    { entryTime: { [Op.between]: [start, end] } },
    institutionFilter(req)
  );
  const rows = await EntryExitLog.findAll({
    where,
    order: [["entryTime", "ASC"]]
  });

  const map = new Map();
  rows.forEach((row) => {
    const item = row.toJSON();
    const key = String(item.driverName || "Unknown Driver").trim().toLowerCase();
    const prev = map.get(key) || {
      driverName: item.driverName || "Unknown Driver",
      totalTrips: 0,
      completedTrips: 0,
      runningTrips: 0,
      totalDistanceKm: 0,
      totalDriveMinutes: 0
    };

    const distance = Number(item.totalDistanceKm || 0);
    const duration =
      Number(item.totalDriveMinutes || 0) ||
      (item.entryTime && item.exitTime
        ? Math.max(
            0,
            Math.round((new Date(item.exitTime).getTime() - new Date(item.entryTime).getTime()) / 60000)
          )
        : 0);

    prev.totalTrips += 1;
    prev.completedTrips += item.exitTime ? 1 : 0;
    prev.runningTrips += item.exitTime ? 0 : 1;
    prev.totalDistanceKm += Number.isFinite(distance) ? distance : 0;
    prev.totalDriveMinutes += Number.isFinite(duration) ? duration : 0;
    map.set(key, prev);
  });

  const items = [...map.values()]
    .map((entry) => ({
      ...entry,
      totalDistanceKm: Number(entry.totalDistanceKm.toFixed(2))
    }))
    .sort((a, b) => b.totalDistanceKm - a.totalDistanceKm);

  res.json({
    date: dateText,
    totalDrivers: items.length,
    items
  });
});

const createEntryExitLog = asyncHandler(async (req, res) => {
  const { EntryExitLog } = getRequestModels(req);
  const payload = withInstitution(req, req.body);
  if (req.user) payload.submittedBy = req.user.id;

  const eventType = String(payload.eventType || "").trim().toLowerCase();
  const hasGpsEvent =
    (eventType === "entry" || eventType === "exit") &&
    payload.latitude !== undefined &&
    payload.longitude !== undefined;

  if (hasGpsEvent) {
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    const commonFields = {
      busNumber: payload.busNumber,
      driverName: payload.driverName,
      route: payload.route
    };

    if (eventType === "entry") {
      const log = await EntryExitLog.create({
        ...commonFields,
        submittedBy: payload.submittedBy,
        entryTime: new Date(),
        entryLatitude: latitude,
        entryLongitude: longitude,
        lastTrackedLatitude: latitude,
        lastTrackedLongitude: longitude,
        monitoringMethod: "GPS",
        status: "Running"
      });
      return res.status(201).json(log);
    }

    const runningLog = await EntryExitLog.findOne({
      where: mergeFilters(
        { status: "Running" },
        commonFields,
        payload.submittedBy ? { submittedBy: payload.submittedBy } : {}
      ),
      order: [["createdAt", "DESC"]]
    });

    if (!runningLog) {
      throw new AppError(
        "No running entry log found for this bus/driver/route. Submit entry first.",
        404
      );
    }

    runningLog.exitTime = new Date();
    runningLog.exitLatitude = latitude;
    runningLog.exitLongitude = longitude;
    updateRunningTripMetrics(runningLog, latitude, longitude, runningLog.exitTime);
    runningLog.monitoringMethod = "GPS";
    runningLog.status = "Completed";
    await runningLog.save();
    return res.status(200).json(runningLog);
  }

  payload.status = payload.exitTime ? "Completed" : "Running";
  payload.monitoringMethod = payload.monitoringMethod || "Manual";
  const log = await EntryExitLog.create(payload);
  return res.status(201).json(log);
});

const createAutoEntryExitLogFromBusGps = asyncHandler(async (req, res) => {
  const { EntryExitLog } = getRequestModels(req);
  const payload = withInstitution(req, req.body);
  if (req.user) payload.submittedBy = req.user.id;

  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const capturedAt = payload.capturedAt ? new Date(payload.capturedAt) : new Date();
  if (Number.isNaN(capturedAt.getTime())) {
    throw new AppError("Invalid capturedAt timestamp.", 400);
  }

  const geofence = getCampusGeofence();
  const distanceMeters = haversineDistanceMeters(
    latitude,
    longitude,
    geofence.lat,
    geofence.lng
  );
  const isInsideCampus = distanceMeters <= geofence.radiusMeters;

  const runningLog = await EntryExitLog.findOne({
    where: { busNumber: payload.busNumber, status: "Running" },
    order: [["createdAt", "DESC"]]
  });

  if (isInsideCampus) {
    if (runningLog) {
      updateRunningTripMetrics(runningLog, latitude, longitude, capturedAt);
      await runningLog.save();
      return res.status(200).json({
        action: "PING_UPDATED_INSIDE",
        message: "Bus is inside campus and running log metrics were updated.",
        distanceMeters: Math.round(distanceMeters),
        log: runningLog
      });
    }

    const log = await EntryExitLog.create({
      busNumber: payload.busNumber,
      driverName: payload.driverName,
      route: payload.route,
      submittedBy: payload.submittedBy,
      entryTime: capturedAt,
      entryLatitude: latitude,
      entryLongitude: longitude,
      lastTrackedLatitude: latitude,
      lastTrackedLongitude: longitude,
      monitoringMethod: "BusGPSAuto",
      status: "Running",
      institution: payload.institution
    });

    return res.status(201).json({
      action: "ENTRY_CREATED",
      message: "Auto entry created from bus GPS.",
      distanceMeters: Math.round(distanceMeters),
      log
    });
  }

  if (!runningLog) {
    return res.status(200).json({
      action: "NOOP_OUTSIDE",
      message: "Bus is outside campus and no running log exists.",
      distanceMeters: Math.round(distanceMeters)
    });
  }

  updateRunningTripMetrics(runningLog, latitude, longitude, capturedAt);
  runningLog.exitTime = capturedAt;
  runningLog.exitLatitude = latitude;
  runningLog.exitLongitude = longitude;
  runningLog.status = "Completed";
  runningLog.monitoringMethod = "BusGPSAuto";
  await runningLog.save();

  return res.status(200).json({
    action: "EXIT_COMPLETED",
    message: "Auto exit completed from bus GPS.",
    distanceMeters: Math.round(distanceMeters),
    log: runningLog
  });
});

module.exports = {
  getAttendance,
  markAttendance,
  getEntryExitLogs,
  getDriverWorkload,
  createEntryExitLog,
  createAutoEntryExitLogFromBusGps
};
