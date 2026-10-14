const test = require('node:test');
const assert = require('node:assert/strict');
const { validateStudentInput } = require('../src/utils/validateStudent');

const valid = {
  studentId: 'CS2024001',
  name: 'Asha Patil',
  email: 'Asha@College.edu',
  department: 'Computer Science',
  semester: '4',
  contact: '+91 98765 43210',
};

test('accepts a valid student and cleans the values', () => {
  const { errors, value } = validateStudentInput({ ...valid, name: '  Asha Patil  ' });
  assert.deepEqual(errors, {});
  assert.equal(value.name, 'Asha Patil');
  assert.equal(value.email, 'asha@college.edu');
  assert.equal(value.semester, 4);
});

test('contact is optional', () => {
  const { errors, value } = validateStudentInput({ ...valid, contact: undefined });
  assert.deepEqual(errors, {});
  assert.equal(value.contact, '');
});

test('reports every missing required field', () => {
  const { errors } = validateStudentInput({});
  assert.deepEqual(Object.keys(errors).sort(), ['department', 'email', 'name', 'semester', 'studentId']);
});

test('handles a missing or non-object body', () => {
  assert.ok(validateStudentInput(undefined).errors.studentId);
  assert.ok(validateStudentInput('text').errors.name);
  assert.ok(validateStudentInput([]).errors.email);
});

test('rejects invalid emails', () => {
  for (const email of ['abc', 'a@b', 'a b@c.com', '@college.edu']) {
    assert.ok(validateStudentInput({ ...valid, email }).errors.email, email);
  }
});

test('rejects invalid semesters', () => {
  for (const semester of [0, 13, -1, 2.5, 'abc', null]) {
    assert.ok(validateStudentInput({ ...valid, semester }).errors.semester, String(semester));
  }
  assert.equal(validateStudentInput({ ...valid, semester: 12 }).errors.semester, undefined);
  assert.equal(validateStudentInput({ ...valid, semester: 1 }).errors.semester, undefined);
});

test('rejects bad student IDs and contacts', () => {
  assert.ok(validateStudentInput({ ...valid, studentId: 'a' }).errors.studentId);
  assert.ok(validateStudentInput({ ...valid, studentId: 'CS 001!' }).errors.studentId);
  assert.ok(validateStudentInput({ ...valid, contact: 'call-me-maybe' }).errors.contact);
});

test('ignores non-string values safely', () => {
  const { errors } = validateStudentInput({ ...valid, name: { $gt: '' }, email: 123 });
  assert.ok(errors.name);
  assert.ok(errors.email);
});
