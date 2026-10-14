const mongoose = require('mongoose');
const {
  EMAIL_PATTERN,
  CONTACT_PATTERN,
  STUDENT_ID_PATTERN,
  MIN_SEMESTER,
  MAX_SEMESTER,
} = require('../utils/validateStudent');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required.'],
      unique: true, // creates a unique index in MongoDB
      trim: true,
      minlength: [2, 'Student ID must be at least 2 characters.'],
      maxlength: [20, 'Student ID must be at most 20 characters.'],
      match: [STUDENT_ID_PATTERN, 'Student ID can only contain letters, numbers, hyphens and underscores.'],
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [100, 'Name must be at most 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email is too long.'],
      match: [EMAIL_PATTERN, 'Please enter a valid email address.'],
    },
    department: {
      type: String,
      required: [true, 'Department is required.'],
      trim: true,
      minlength: [2, 'Department must be at least 2 characters.'],
      maxlength: [100, 'Department must be at most 100 characters.'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required.'],
      min: [MIN_SEMESTER, `Semester must be at least ${MIN_SEMESTER}.`],
      max: [MAX_SEMESTER, `Semester must be at most ${MAX_SEMESTER}.`],
      validate: {
        validator: Number.isInteger,
        message: 'Semester must be a whole number.',
      },
    },
    contact: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => value === '' || CONTACT_PATTERN.test(value),
        message: 'Contact number is not valid.',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
