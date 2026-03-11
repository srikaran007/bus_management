const express = require("express");
const {
  createDriver,
  deleteDriver,
  getDriverById,
  getDrivers,
  updateDriver
} = require("../controllers/driverController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const { createDriverSchema, updateDriverSchema } = require("../validation/driverValidation");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getDrivers
);
router.get(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getDriverById
);
router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(createDriverSchema), createDriver);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(updateDriverSchema), updateDriver);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteDriver);

module.exports = router;
