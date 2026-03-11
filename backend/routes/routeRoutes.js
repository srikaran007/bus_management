const express = require("express");
const { createRoute, deleteRoute, getRouteById, getRoutes, updateRoute } = require("../controllers/routeController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const { createRouteSchema, updateRouteSchema } = require("../validation/routeValidation");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getRoutes
);
router.get(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER),
  getRouteById
);
router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(createRouteSchema), createRoute);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), validate(updateRouteSchema), updateRoute);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteRoute);

module.exports = router;
