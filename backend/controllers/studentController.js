const Student = require("../models/Student");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../utils/constants");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
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
  const filter = mergeFilters(searchFilter, routeFilter, busFilter, departmentFilter);

  const [items, total] = await Promise.all([
    Student.find(filter).populate("user", "name email role").sort(sort).skip(skip).limit(limit),
    Student.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("user", "name email role");
  if (!student) throw new AppError("Student not found", 404);

  if (req.user.role === ROLES.STUDENT && String(student.user?._id || "") !== String(req.user._id)) {
    throw new AppError("Forbidden for this student", 403);
  }

  res.json(student);
});

const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate("user", "name email role");
  if (!student) throw new AppError("Student profile not found", 404);
  res.json(student);
});

const createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json(student);
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!student) throw new AppError("Student not found", 404);
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  res.json({ message: "Student deleted successfully" });
});

module.exports = { getStudents, getStudentById, getMyStudentProfile, createStudent, updateStudent, deleteStudent };
