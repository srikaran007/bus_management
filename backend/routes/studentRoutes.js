const express = require("express");
const {
  createStudent,
  deleteStudent,
  getStudentById,
  getMyStudentProfile,
  getStudents,
  updateStudent
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { ROLES } = require("../utils/constants");
const { validate } = require("../middleware/validateMiddleware");
const { createStudentSchema, updateStudentSchema } = require("../validation/studentValidation");

const router = express.Router();

router.get("/me", protect, allowRoles(ROLES.STUDENT), getMyStudentProfile);
router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF), getStudents);
router.get(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT),
  getStudentById
);
router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.STAFF), validate(createStudentSchema), createStudent);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.STAFF), validate(updateStudentSchema), updateStudent);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteStudent);

module.exports = router;
