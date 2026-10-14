const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/utils/AppError');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');
const logger = require('../src/utils/logger');

// Minimal fake of Express' res object
function run(err) {
  const res = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const original = console.error;
  console.error = () => {}; // keep test output clean
  try {
    errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, () => {});
  } finally {
    console.error = original;
  }
  return res;
}

test('AppError keeps its status, message and field errors', () => {
  const res = run(new AppError('Bad data', 400, { email: 'bad' }));
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: 'Bad data', errors: { email: 'bad' } });
});

test('duplicate key error becomes 409 with a friendly message', () => {
  const err = Object.assign(new Error('E11000 duplicate key error ... secret details'), {
    code: 11000,
    keyPattern: { studentId: 1 },
  });
  const res = run(err);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, 'A student with this Student ID already exists.');
  assert.equal(res.body.errors.studentId, res.body.message);
  assert.ok(!JSON.stringify(res.body).includes('E11000'));
});

test('mongoose ValidationError becomes 400 with per-field messages', () => {
  const err = Object.assign(new Error('v'), {
    name: 'ValidationError',
    errors: { email: { path: 'email', message: 'Please enter a valid email address.' } },
  });
  const res = run(err);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.errors.email, 'Please enter a valid email address.');
});

test('CastError, malformed JSON, too-large body and CORS are mapped', () => {
  assert.equal(run(Object.assign(new Error('c'), { name: 'CastError' })).statusCode, 400);
  assert.equal(run(Object.assign(new Error('j'), { type: 'entity.parse.failed' })).statusCode, 400);
  assert.equal(run(Object.assign(new Error('t'), { type: 'entity.too.large' })).statusCode, 413);
  assert.equal(run(Object.assign(new Error('o'), { isCorsError: true })).statusCode, 403);
});

test('database connection errors become 503', () => {
  assert.equal(run(Object.assign(new Error('x'), { name: 'MongoServerSelectionError' })).statusCode, 503);
});

test('unexpected errors become a generic 500 without leaking details', () => {
  const res = run(new Error('password=hunter2 stack details'));
  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(res.body).includes('hunter2'));
});

test('notFound returns 404 JSON', () => {
  const res = { status(c) { this.code = c; return this; }, json(b) { this.body = b; } };
  notFound({ method: 'GET', originalUrl: '/nope' }, res);
  assert.equal(res.code, 404);
  assert.equal(res.body.success, false);
});

test('logger hides database passwords', () => {
  const out = logger.scrub('failed: mongodb+srv://studentapp:Sup3rSecret@cluster0.abc.mongodb.net/db');
  assert.ok(!out.includes('Sup3rSecret'));
  assert.ok(!out.includes('studentapp'));
});
