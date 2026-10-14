require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const Student = require('./models/Student');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const RETRY_DELAY_MS = 5000;

if (!MONGODB_URI || MONGODB_URI.includes('YOUR_MONGODB_ATLAS_CONNECTION_STRING')) {
  logger.error(
    'MONGODB_URI is missing or still a placeholder. Create backend/.env (locally) or set the variable on Render.'
  );
  process.exit(1);
}

let server;
let shuttingDown = false;

mongoose.connection.on('connected', () => logger.info('MongoDB connection established.'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB connection lost.'));
mongoose.connection.on('error', (err) => logger.error(`MongoDB connection error: ${err.message}`));

// Keep trying until MongoDB is reachable. While it is not connected,
// /api/students answers 503 and /api/health reports "degraded".
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    // Make sure the unique index on studentId exists before we accept writes.
    try {
      await Student.init();
      logger.info('Database indexes are ready.');
    } catch (indexError) {
      logger.warn(`Could not confirm database indexes: ${indexError.message}`);
    }
  } catch (err) {
    logger.error(`Could not connect to MongoDB: ${err.message}`);
    logger.error(
      'Check: (1) username/password in MONGODB_URI, (2) Atlas Network Access allows this server, (3) the cluster is running.'
    );
    if (!shuttingDown) {
      logger.warn(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      setTimeout(connectToDatabase, RETRY_DELAY_MS);
    }
  }
}

function startServer() {
  server = app.listen(PORT, () => {
    logger.info(`API listening on port ${PORT} (${process.env.NODE_ENV || 'development'}).`);
  });
  connectToDatabase();
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received. Shutting down...`);
  if (server) server.close();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason && reason.message ? reason.message : reason}`);
});

startServer();
