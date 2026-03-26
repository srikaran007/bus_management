const express = require("express");
const {
  getDriverPerformance,
  generateDriverSchedule,
  getDriverSchedule,
  updateDriverShiftStatus,
  getSpareDriverRecommendations
} = require("../controllers/mlController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const { generateScheduleSchema, updateShiftStatusSchema } = require("../validation/mlValidation");

const router = express.Router();

router.use(protect);

router.get("/driver-schedule", allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), getDriverSchedule);

router.get("/driver-performance", allowRoles(ROLES.ADMIN), getDriverPerformance);
router.get("/driver-spares", allowRoles(ROLES.ADMIN), getSpareDriverRecommendations);
router.post(
  "/driver-schedule/generate",
  allowRoles(ROLES.ADMIN),
  validate(generateScheduleSchema),
  generateDriverSchedule
);
router.patch(
  "/driver-schedule/:id/status",
  allowRoles(ROLES.ADMIN),
  validate(updateShiftStatusSchema),
  updateDriverShiftStatus
);

module.exports = router;
