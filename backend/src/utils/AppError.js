// An error we throw on purpose, carrying the HTTP status code and
// (optionally) per-field validation messages for the client.
class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

module.exports = AppError;
