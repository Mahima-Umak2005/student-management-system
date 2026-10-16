require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { createApiClient } = require('./apiClient');
const { createServer } = require('./createServer');

const API_BASE_URL = process.env.API_BASE_URL;
const TRANSPORT = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();
const READ_ONLY = String(process.env.MCP_READ_ONLY || '').toLowerCase() === 'true';
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

// stdio uses stdout for the protocol itself, so every log line goes to stderr.
const log = (message) => console.error(`[mcp] ${message}`);

if (!API_BASE_URL) {
  log('API_BASE_URL is required, e.g. https://your-service.onrender.com (or http://localhost:5000).');
  process.exit(1);
}

const api = createApiClient({ baseUrl: API_BASE_URL });

async function startStdio() {
  const server = createServer(api, { readOnly: READ_ONLY });
  await server.connect(new StdioServerTransport());
  log(`stdio server ready -> ${API_BASE_URL} (${READ_ONLY ? 'read-only' : 'read/write'})`);
}

// Constant-time comparison so the token cannot be guessed byte by byte.
function tokenMatches(header) {
  const expected = Buffer.from(`Bearer ${AUTH_TOKEN}`);
  const given = Buffer.from(header || '');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

async function startHttp() {
  if (!AUTH_TOKEN || AUTH_TOKEN.length < 16) {
    log('MCP_AUTH_TOKEN (at least 16 characters) is required in http mode: this server can change student data.');
    process.exit(1);
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Stateless: each request gets its own server + transport, so it scales and survives restarts.
  app.post('/mcp', async (req, res) => {
    if (!tokenMatches(req.headers.authorization)) {
      return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });
    }
    try {
      const server = createServer(api, { readOnly: READ_ONLY });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      log(`request failed: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
  });

  const methodNotAllowed = (req, res) =>
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  app.listen(PORT, () =>
    log(`HTTP server on port ${PORT}, endpoint /mcp -> ${API_BASE_URL} (${READ_ONLY ? 'read-only' : 'read/write'})`)
  );
}

(TRANSPORT === 'http' ? startHttp() : startStdio()).catch((err) => {
  log(`fatal: ${err.message}`);
  process.exit(1);
});
