const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const studentRoutes = require('./routes/studentRoutes');
const requireDatabase = require('./middleware/requireDatabase');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Render (and most hosts) sit behind a proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---- Security headers ----
// The API is called from another origin (Netlify), so allow cross-origin reads of its responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ---- CORS ----
// FRONTEND_URL may hold one or several origins separated by commas.
// An origin is "https://site.netlify.app" - no path and no trailing slash.
const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '');

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  // Vite may be opened through either hostname while developing.
  ['http://localhost:5173', 'http://127.0.0.1:5173'].forEach((o) => {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  });
}

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = curl, Postman, server-to-server, health checks.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`Blocked request from origin: ${origin}`);
      const error = new Error('Origin not allowed by CORS');
      error.isCorsError = true;
      return callback(error);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
);

// ---- Body parsing with a size limit ----
app.use(express.json({ limit: '10kb' }));

// ---- Simple request log (method, path, status, time). No bodies. ----
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// ---- Routes ----
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Information Management System API is running.',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const database = states[mongoose.connection.readyState] || 'unknown';
  const healthy = mongoose.connection.readyState === 1;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/students', requireDatabase, studentRoutes);

// ---- Errors ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
