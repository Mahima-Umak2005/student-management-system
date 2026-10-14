const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { validateStudentInput } = require('../utils/validateStudent');

// Lets us write async controllers without try/catch in each one.
// Any error is passed to the central error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// A valid MongoDB ObjectId is exactly 24 hexadecimal characters.
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function assertValidId(id) {
  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new AppError('Invalid student ID format. Expected a 24-character MongoDB document ID.', 400);
  }
}

function assertValidInput(body) {
  const { errors, value } = validateStudentInput(body);
  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed. Please check the highlighted fields.', 400, errors);
  }
  return value;
}

// GET /api/students
const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// GET /api/students/:id
const getStudentById = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const student = await Student.findById(req.params.id).lean();
  if (!student) throw new AppError('Student not found.', 404);
  res.status(200).json({ success: true, data: student });
});

// POST /api/students
const createStudent = asyncHandler(async (req, res) => {
  const value = assertValidInput(req.body);
  const student = await Student.create(value);
  res.status(201).json({
    success: true,
    message: 'Student added successfully.',
    data: student,
  });
});

// PUT /api/students/:id
const updateStudent = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const value = assertValidInput(req.body);
  const student = await Student.findByIdAndUpdate(req.params.id, value, {
    new: true,
    runValidators: true,
  });
  if (!student) throw new AppError('Student not found.', 404);
  res.status(200).json({
    success: true,
    message: 'Student updated successfully.',
    data: student,
  });
});

// DELETE /api/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new AppError('Student not found.', 404);
  res.status(200).json({
    success: true,
    message: 'Student deleted successfully.',
    data: { _id: student._id },
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
