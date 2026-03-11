const express = require("express");
const { getAuditLogs } = require("../controllers/auditController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT), getAuditLogs);

module.exports = router;
