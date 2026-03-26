const express = require("express");
const {
  getDashboardSummary,
  getBusInchargeAssignments,
  assignBusIncharge
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.get("/dashboard-summary", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), getDashboardSummary);
router.get(
  "/bus-incharge-assignments",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT),
  getBusInchargeAssignments
);
router.patch(
  "/bus-incharge-assignments/:busId",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT),
  assignBusIncharge
);

module.exports = router;
