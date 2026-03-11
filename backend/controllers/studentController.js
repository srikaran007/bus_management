const { Student, User } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../utils/constants");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeStudent = (student) => {
  const data = student.toJSON();
  if (data.userDetails) {
    data.user = data.userDetails;
    delete data.userDetails;
  }
  return data;
};

const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, [
    "studentName",
    "registerNumber",
    "department",
    "busNumber",
    "routeName",
    "boardingPoint"
  ]);
  const routeFilter = req.query.routeName ? { routeName: req.query.routeName } : {};
  const busFilter = req.query.busNumber ? { busNumber: req.query.busNumber } : {};
  const departmentFilter = req.query.department ? { department: req.query.department } : {};
  const where = mergeFilters(searchFilter, routeFilter, busFilter, departmentFilter);

  const { rows, count } = await Student.findAndCountAll({
    where,
    include: [{ model: User, as: "userDetails", attributes: ["id", "name", "email", "role"] }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeStudent),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, {
    include: [{ model: User, as: "userDetails", attributes: ["id", "name", "email", "role"] }]
  });
  if (!student) throw new AppError("Student not found", 404);

  if (req.user.role === ROLES.STUDENT && String(student.user || "") !== String(req.user.id)) {
    throw new AppError("Forbidden for this student", 403);
  }

  res.json(serializeStudent(student));
});

const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    where: { user: req.user.id },
    include: [{ model: User, as: "userDetails", attributes: ["id", "name", "email", "role"] }]
  });
  if (!student) throw new AppError("Student profile not found", 404);
  res.json(serializeStudent(student));
});

const createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json(student);
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  await student.update(req.body);
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  await student.destroy();
  res.json({ message: "Student deleted successfully" });
});

module.exports = { getStudents, getStudentById, getMyStudentProfile, createStudent, updateStudent, deleteStudent };
