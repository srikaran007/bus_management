const express = require("express");
const {
  createEntryExitLog,
  createAutoEntryExitLogFromBusGps,
  getAttendance,
  getDriverWorkload,
  getEntryExitLogs,
  markAttendance
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const {
  markAttendanceSchema,
  createEntryExitSchema,
  busGpsPingSchema
} = require("../validation/attendanceValidation");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.DRIVER, ROLES.STUDENT),
  getAttendance
);
router.post(
  "/",
  protect,
  allowRoles(ROLES.DRIVER, ROLES.STAFF),
  validate(markAttendanceSchema),
  markAttendance
);
router.get(
  "/entry-exit",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT),
  getEntryExitLogs
);
router.get(
  "/driver-workload",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT),
  getDriverWorkload
);
router.post(
  "/entry-exit",
  protect,
  allowRoles(ROLES.DRIVER),
  validate(createEntryExitSchema),
  createEntryExitLog
);
router.post(
  "/entry-exit/bus-gps",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.DRIVER),
  validate(busGpsPingSchema),
  createAutoEntryExitLogFromBusGps
);

module.exports = router;
