const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { registerTools } = require('./tools');

function createServer(api, { readOnly = false } = {}) {
  const server = new McpServer({
    name: 'student-management',
    version: '1.0.0',
  });
  registerTools(server, api, { readOnly });
  return server;
}

module.exports = { createServer };
