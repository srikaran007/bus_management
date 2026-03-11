const express = require("express");
const { createBus, deleteBus, getBusById, getBuses, updateBus } = require("../controllers/busController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const { createBusSchema, updateBusSchema } = require("../validation/busValidation");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getBuses
);
router.get(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getBusById
);
router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(createBusSchema), createBus);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(updateBusSchema), updateBus);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteBus);

module.exports = router;
