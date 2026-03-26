const { User, getRequestModels } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../utils/constants");
const { institutionFilter, withInstitution, canAccessInstitutionRecord, resolveInstitution } = require("../utils/institutionScope");
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
  const { Student } = getRequestModels(req);
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
  const where = mergeFilters(searchFilter, routeFilter, busFilter, departmentFilter, institutionFilter(req));
  const userWhere = institutionFilter(req);

  const { rows, count } = await Student.findAndCountAll({
    where,
    include: [
      { model: User, as: "userDetails", attributes: ["id", "name", "email", "role", "institution"], where: userWhere, required: false }
    ],
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
  const { Student } = getRequestModels(req);
  const userWhere = institutionFilter(req);
  const student = await Student.findByPk(req.params.id, {
    include: [
      { model: User, as: "userDetails", attributes: ["id", "name", "email", "role", "institution"], where: userWhere, required: false }
    ]
  });
  if (!student || !canAccessInstitutionRecord(req, student)) throw new AppError("Student not found", 404);

  if (req.user.role === ROLES.STUDENT && String(student.user || "") !== String(req.user.id)) {
    throw new AppError("Forbidden for this student", 403);
  }

  res.json(serializeStudent(student));
});

const getMyStudentProfile = asyncHandler(async (req, res) => {
  const { Student } = getRequestModels(req);
  const student = await Student.findOne({
    where: mergeFilters({ user: req.user.id }, institutionFilter(req)),
    include: [{ model: User, as: "userDetails", attributes: ["id", "name", "email", "role", "institution"] }]
  });
  if (!student) throw new AppError("Student profile not found", 404);
  res.json(serializeStudent(student));
});

const createStudent = asyncHandler(async (req, res) => {
  const { Student } = getRequestModels(req);
  const payload = withInstitution(req, req.body);

  if (payload.user) {
    const linkedUser = await User.findByPk(payload.user);
    if (!linkedUser) throw new AppError("Linked user not found", 404);
    const reqInstitution = resolveInstitution(req);
    if (reqInstitution && linkedUser.institution !== reqInstitution) {
      throw new AppError("Linked user belongs to a different institution", 400);
    }
  }

  const student = await Student.create(payload);
  res.status(201).json(student);
});

const updateStudent = asyncHandler(async (req, res) => {
  const { Student } = getRequestModels(req);
  const student = await Student.findByPk(req.params.id);
  if (!student || !canAccessInstitutionRecord(req, student)) throw new AppError("Student not found", 404);

  const updates = { ...req.body };
  delete updates.institution;

  if (updates.user) {
    const linkedUser = await User.findByPk(updates.user);
    if (!linkedUser) throw new AppError("Linked user not found", 404);
    const reqInstitution = resolveInstitution(req);
    if (reqInstitution && linkedUser.institution !== reqInstitution) {
      throw new AppError("Linked user belongs to a different institution", 400);
    }
  }

  await student.update(updates);
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { Student } = getRequestModels(req);
  const student = await Student.findByPk(req.params.id);
  if (!student || !canAccessInstitutionRecord(req, student)) throw new AppError("Student not found", 404);
  await student.destroy();
  res.json({ message: "Student deleted successfully" });
});

module.exports = { getStudents, getStudentById, getMyStudentProfile, createStudent, updateStudent, deleteStudent };
