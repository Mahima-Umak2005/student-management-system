const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js');
const { createApiClient } = require('../src/apiClient');
const { createServer } = require('../src/createServer');

// A tiny in-memory imitation of the backend's /api/students contract.
function startFakeApi() {
  const students = [
    { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', studentId: 'CS001', name: 'Asha Patil', email: 'asha@college.edu', department: 'Computer Science', semester: 4, contact: '9876543210' },
    { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', studentId: 'ME001', name: 'Ravi Kumar', email: 'ravi@college.edu', department: 'Mechanical', semester: 2, contact: '' },
  ];
  let nextId = 1;
  const calls = [];

  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      calls.push(`${req.method} ${req.url}`);
      const body = raw ? JSON.parse(raw) : undefined;
      const idMatch = req.url.match(/^\/api\/students\/([^/]+)$/);

      if (req.url === '/api/health') return send(res, 200, { success: true, status: 'ok', database: 'connected' });
      if (req.url === '/api/students' && req.method === 'GET') return send(res, 200, { success: true, count: students.length, data: students });
      if (req.url === '/api/students' && req.method === 'POST') {
        if (students.some((s) => s.studentId === body.studentId)) {
          return send(res, 409, { success: false, message: 'A student with this Student ID already exists.', errors: { studentId: 'duplicate' } });
        }
        const created = { _id: String(nextId++).padStart(24, 'c'), ...body };
        students.push(created);
        return send(res, 201, { success: true, data: created });
      }
      if (idMatch) {
        const index = students.findIndex((s) => s._id === idMatch[1]);
        if (index === -1) return send(res, 404, { success: false, message: 'Student not found.' });
        if (req.method === 'GET') return send(res, 200, { success: true, data: students[index] });
        if (req.method === 'PUT') {
          students[index] = { _id: idMatch[1], ...body };
          return send(res, 200, { success: true, data: students[index] });
        }
        if (req.method === 'DELETE') {
          const [removed] = students.splice(index, 1);
          return send(res, 200, { success: true, data: { _id: removed._id } });
        }
      }
      return send(res, 404, { success: false, message: 'Route not found' });
    });
  });

  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${server.address().port}`, students, calls, close: () => server.close() })
    )
  );
}

async function connect(apiUrl, options) {
  const server = createServer(createApiClient({ baseUrl: apiUrl }), options);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return client;
}

const text = (result) => result.content[0].text;
const json = (result) => JSON.parse(text(result));

test('exposes all tools in read/write mode', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);
  const names = (await client.listTools()).tools.map((x) => x.name).sort();
  assert.deepEqual(names, ['check_health', 'create_student', 'delete_student', 'get_student', 'list_students', 'student_stats', 'update_student']);
});

test('read-only mode hides every write tool', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url, { readOnly: true });
  const names = (await client.listTools()).tools.map((x) => x.name).sort();
  assert.deepEqual(names, ['check_health', 'get_student', 'list_students', 'student_stats']);
});

test('check_health reports database status', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);
  const result = json(await client.callTool({ name: 'check_health', arguments: {} }));
  assert.equal(result.database, 'connected');
});

test('list_students filters by query, department, semester and limit', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);

  let r = json(await client.callTool({ name: 'list_students', arguments: { query: 'ASHA' } }));
  assert.equal(r.totalMatches, 1);
  assert.equal(r.students[0].studentId, 'CS001');

  r = json(await client.callTool({ name: 'list_students', arguments: { department: 'mechanical' } }));
  assert.equal(r.students[0].studentId, 'ME001');

  r = json(await client.callTool({ name: 'list_students', arguments: { semester: 4 } }));
  assert.equal(r.totalMatches, 1);

  r = json(await client.callTool({ name: 'list_students', arguments: { limit: 1 } }));
  assert.equal(r.totalMatches, 2);
  assert.equal(r.returned, 1);
});

test('get_student works with a student ID and with a database _id', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);

  assert.equal(json(await client.callTool({ name: 'get_student', arguments: { student: 'cs001' } })).name, 'Asha Patil');
  assert.equal(json(await client.callTool({ name: 'get_student', arguments: { student: 'bbbbbbbbbbbbbbbbbbbbbbbb' } })).studentId, 'ME001');

  const missing = await client.callTool({ name: 'get_student', arguments: { student: 'NOPE99' } });
  assert.equal(missing.isError, true);
  assert.match(text(missing), /No student found/);
});

test('student_stats counts by department and semester', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);
  const r = json(await client.callTool({ name: 'student_stats', arguments: {} }));
  assert.equal(r.total, 2);
  assert.equal(r.byDepartment['Computer Science'], 1);
  assert.equal(r.bySemester['2'], 1);
});

test('create_student succeeds, and a duplicate comes back as a readable error', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);
  const student = { studentId: 'EE001', name: 'Meera Joshi', email: 'meera@college.edu', department: 'Electrical', semester: 3 };

  const created = json(await client.callTool({ name: 'create_student', arguments: student }));
  assert.equal(created.studentId, 'EE001');

  const dup = await client.callTool({ name: 'create_student', arguments: student });
  assert.equal(dup.isError, true);
  assert.match(text(dup), /409/);
  assert.match(text(dup), /already exists/);
});

test('invalid input is rejected before it reaches the API', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);
  const before = api.calls.length;
  const result = await client.callTool({
    name: 'create_student',
    arguments: { studentId: 'X1', name: 'A', email: 'not-an-email', department: 'CS', semester: 99 },
  });
  assert.equal(result.isError, true);
  assert.equal(api.calls.length, before);
});

test('update_student changes only the fields given and keeps the rest', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);

  const updated = json(await client.callTool({ name: 'update_student', arguments: { student: 'CS001', semester: 5 } }));
  assert.equal(updated.semester, 5);
  assert.equal(updated.name, 'Asha Patil');
  assert.equal(updated.email, 'asha@college.edu');
  assert.equal(updated.contact, '9876543210');
  assert.equal(updated._id, 'aaaaaaaaaaaaaaaaaaaaaaaa');
});

test('delete_student requires confirm: true', async (t) => {
  const api = await startFakeApi();
  t.after(api.close);
  const client = await connect(api.url);

  const refused = await client.callTool({ name: 'delete_student', arguments: { student: 'ME001' } });
  assert.equal(refused.isError, true);
  assert.equal(api.students.length, 2);

  const done = json(await client.callTool({ name: 'delete_student', arguments: { student: 'ME001', confirm: true } }));
  assert.equal(done.deleted, true);
  assert.equal(api.students.length, 1);
});

test('an unreachable API produces a clear tool error', async () => {
  const client = await connect('http://127.0.0.1:9');
  const result = await client.callTool({ name: 'list_students', arguments: {} });
  assert.equal(result.isError, true);
  assert.match(text(result), /Could not reach the API/);
});
