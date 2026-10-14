const logger = require('../utils/logger');

// 404 for any URL that does not match a route.
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Turns every kind of error into one consistent JSON shape.
// Stack traces and database internals are logged on the server only.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Our own deliberate errors (validation, not found, ...)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Duplicate key (unique index on studentId)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'studentId';
    const label = field === 'studentId' ? 'Student ID' : field;
    const message = `A student with this ${label} already exists.`;
    return res.status(409).json({ success: false, message, errors: { [field]: message } });
  }

  // Mongoose schema validation failed
  if (err.name === 'ValidationError' && err.errors) {
    const errors = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the highlighted fields.',
      errors,
    });
  }

  // Bad ObjectId that slipped through
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid value supplied for a field.' });
  }

  // Malformed JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON.' });
  }

  // Body larger than the configured limit
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large.' });
  }

  // Blocked by our CORS rule
  if (err.isCorsError) {
    return res.status(403).json({ success: false, message: 'This origin is not allowed by CORS.' });
  }

  // MongoDB connection problems during a request
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    logger.error(`Database unreachable: ${err.message}`);
    return res.status(503).json({
      success: false,
      message: 'The database is not reachable right now. Please try again shortly.',
    });
  }

  // Anything unexpected: log details privately, show a generic message.
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on the server. Please try again.',
  });
};

module.exports = { notFound, errorHandler };
