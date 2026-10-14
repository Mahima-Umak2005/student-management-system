// Validation rules for student data. They are written as a plain function
// (no database needed) so they are easy to test and easy to explain.

const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_PATTERN = /^[0-9+\-\s()]{7,15}$/;

const MIN_SEMESTER = 1;
const MAX_SEMESTER = 12;

const clean = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * Checks the request body and returns:
 *   { errors: { field: "message" }, value: { cleaned fields } }
 * `errors` is an empty object when everything is valid.
 * Only the six known fields are returned, so unknown fields are ignored.
 */
function validateStudentInput(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = {};

  const studentId = clean(input.studentId);
  const name = clean(input.name);
  const email = clean(input.email);
  const department = clean(input.department);
  const contact = clean(input.contact);

  // studentId
  if (typeof studentId !== 'string' || studentId === '') {
    errors.studentId = 'Student ID is required.';
  } else if (studentId.length < 2 || studentId.length > 20) {
    errors.studentId = 'Student ID must be between 2 and 20 characters.';
  } else if (!STUDENT_ID_PATTERN.test(studentId)) {
    errors.studentId = 'Student ID can only contain letters, numbers, hyphens and underscores.';
  }

  // name
  if (typeof name !== 'string' || name === '') {
    errors.name = 'Name is required.';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }

  // email
  if (typeof email !== 'string' || email === '') {
    errors.email = 'Email is required.';
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address, for example name@college.edu.';
  }

  // department
  if (typeof department !== 'string' || department === '') {
    errors.department = 'Department is required.';
  } else if (department.length < 2 || department.length > 100) {
    errors.department = 'Department must be between 2 and 100 characters.';
  }

  // semester
  let semester = input.semester;
  if (typeof semester === 'string') semester = semester.trim();
  if (semester === undefined || semester === null || semester === '') {
    errors.semester = 'Semester is required.';
  } else {
    const number = Number(semester);
    if (!Number.isInteger(number) || number < MIN_SEMESTER || number > MAX_SEMESTER) {
      errors.semester = `Semester must be a whole number from ${MIN_SEMESTER} to ${MAX_SEMESTER}.`;
    } else {
      semester = number;
    }
  }

  // contact (optional)
  let contactValue = '';
  if (contact !== undefined && contact !== null && contact !== '') {
    if (typeof contact !== 'string' || !CONTACT_PATTERN.test(contact)) {
      errors.contact =
        'Contact number must be 7 to 15 characters and may contain digits, spaces, +, - and brackets.';
    } else {
      contactValue = contact;
    }
  }

  return {
    errors,
    value: {
      studentId,
      name,
      email: typeof email === 'string' ? email.toLowerCase() : email,
      department,
      semester,
      contact: contactValue,
    },
  };
}

module.exports = {
  validateStudentInput,
  MIN_SEMESTER,
  MAX_SEMESTER,
  STUDENT_ID_PATTERN,
  EMAIL_PATTERN,
  CONTACT_PATTERN,
};
