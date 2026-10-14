const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Guards database-dependent routes. If MongoDB is not connected yet (or the
// connection dropped) the client gets a clear 503 instead of a long hang.
module.exports = function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(
      new AppError('The database is not connected right now. Please try again in a moment.', 503)
    );
  }
  return next();
};
