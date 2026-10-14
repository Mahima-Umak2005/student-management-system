// Same rules as the backend (backend/src/utils/validateStudent.js).
// The frontend check gives instant feedback; the backend check is the one
// that actually protects the database.

const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_PATTERN = /^[0-9+\-\s()]{7,15}$/;

export const MIN_SEMESTER = 1;
export const MAX_SEMESTER = 12;

export const EMPTY_STUDENT = {
  studentId: '',
  name: '',
  email: '',
  department: '',
  semester: '',
  contact: '',
};

export function validateStudent(values) {
  const errors = {};
  const studentId = values.studentId.trim();
  const name = values.name.trim();
  const email = values.email.trim();
  const department = values.department.trim();
  const contact = values.contact.trim();
  const semester = String(values.semester).trim();

  if (!studentId) errors.studentId = 'Student ID is required.';
  else if (studentId.length < 2 || studentId.length > 20)
    errors.studentId = 'Student ID must be between 2 and 20 characters.';
  else if (!STUDENT_ID_PATTERN.test(studentId))
    errors.studentId = 'Use only letters, numbers, hyphens and underscores.';

  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2 || name.length > 100) errors.name = 'Name must be between 2 and 100 characters.';

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email, for example name@college.edu.';

  if (!department) errors.department = 'Department is required.';
  else if (department.length < 2 || department.length > 100)
    errors.department = 'Department must be between 2 and 100 characters.';

  if (!semester) errors.semester = 'Semester is required.';
  else {
    const number = Number(semester);
    if (!Number.isInteger(number) || number < MIN_SEMESTER || number > MAX_SEMESTER)
      errors.semester = `Semester must be a whole number from ${MIN_SEMESTER} to ${MAX_SEMESTER}.`;
  }

  if (contact && !CONTACT_PATTERN.test(contact))
    errors.contact = 'Use 7 to 15 characters: digits, spaces, +, - or brackets.';

  return errors;
}

export function toPayload(values) {
  return {
    studentId: values.studentId.trim(),
    name: values.name.trim(),
    email: values.email.trim(),
    department: values.department.trim(),
    semester: Number(values.semester),
    contact: values.contact.trim(),
  };
}

export function fromStudent(student) {
  return {
    studentId: student.studentId ?? '',
    name: student.name ?? '',
    email: student.email ?? '',
    department: student.department ?? '',
    semester: String(student.semester ?? ''),
    contact: student.contact ?? '',
  };
}
