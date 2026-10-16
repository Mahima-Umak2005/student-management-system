# Student Management MCP Server

Lets Claude manage the Student Information Management System. It wraps the existing REST API
(`../backend`) as MCP tools, so Claude can look up, add, update and delete student records
in plain language. It never talks to MongoDB directly: every change goes through the API, so the
backend's validation stays the single source of truth. The backend code is not modified.

```
Claude  --MCP-->  mcp-server  --HTTPS-->  Express API (Render)  -->  MongoDB Atlas
```

## Tools

| Tool | What it does | Changes data? |
|------|--------------|---------------|
| `check_health` | API and database status | no |
| `list_students` | List/search by text, department, semester (with limit) | no |
| `get_student` | One student, by student ID (`CS2024001`) or database `_id` | no |
| `student_stats` | Totals per department and per semester | no |
| `create_student` | Add a student (duplicate student IDs are rejected) | yes |
| `update_student` | Change only the fields you give; the rest are kept | yes |
| `delete_student` | Permanent delete; needs `confirm: true` | yes |

Set `MCP_READ_ONLY=true` and the three write tools are not exposed at all. Start there if you
want to trust the setup first.

## Run it

```bash
cd mcp-server
npm install
cp .env.example .env      # then edit API_BASE_URL
```

`API_BASE_URL` is your Render URL (or `http://localhost:5000` while developing). Note that a
free Render service sleeps when idle, so the first call can take up to a minute.

### Option A: on your own computer (stdio)

Claude Code:

```bash
claude mcp add student-management -e API_BASE_URL=https://YOUR-SERVICE.onrender.com -- node /full/path/to/mcp-server/src/index.js
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "student-management": {
      "command": "node",
      "args": ["/full/path/to/mcp-server/src/index.js"],
      "env": { "API_BASE_URL": "https://YOUR-SERVICE.onrender.com" }
    }
  }
}
```

### Option B: hosted, so it works from the cloud (HTTP)

Deploy `mcp-server` as a second Render web service next to the API:

| Setting | Value |
|---------|-------|
| Root Directory | `mcp-server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| `MCP_TRANSPORT` | `http` |
| `API_BASE_URL` | your API's Render URL |
| `MCP_AUTH_TOKEN` | a long random secret (see below) |

Generate the token: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

The endpoint is `https://YOUR-MCP-SERVICE.onrender.com/mcp`. Every request must carry
`Authorization: Bearer <token>`, otherwise it gets `401`. The server refuses to start in HTTP
mode without a token of at least 16 characters, because it can change student data.

Claude Code:

```bash
claude mcp add --transport http student-management https://YOUR-MCP-SERVICE.onrender.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

## Try it

Once connected, ask things like:

- "Is the student platform healthy?"
- "How many students are in each department?"
- "Add Meera Joshi, ID EE2024007, meera@college.edu, Electrical, semester 3."
- "Move CS2024001 to semester 5."
- "Delete EE2024007."

## Tests

```bash
npm test
```

Runs every tool through a real MCP client against a fake API: filters, lookup by student ID,
partial updates, duplicate handling, delete confirmation, read-only mode and an unreachable API.

## Security notes

- Never commit `.env`; it is already git-ignored. `MCP_AUTH_TOKEN` is a secret.
- Anyone holding the token can add, edit and delete students. Rotate it by changing the variable on Render.
- The API has no login of its own, so this server is only as safe as its token. Use `MCP_READ_ONLY=true` where writes are not needed.
