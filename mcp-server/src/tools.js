const { z } = require('zod');
const { ApiError } = require('./apiClient');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Same rules as backend/src/utils/validateStudent.js. The backend re-checks everything,
// these just give Claude an early, clear error.
const fields = {
  studentId: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, hyphens and underscores only')
    .describe('College student ID, e.g. CS2024001. Must be unique.'),
  name: z.string().min(2).max(100).describe('Full name'),
  email: z.string().email().max(254).describe('Email address'),
  department: z.string().min(2).max(100).describe('Department, e.g. Computer Science'),
  semester: z.number().int().min(1).max(12).describe('Semester, whole number from 1 to 12'),
  contact: z
    .string()
    .regex(/^[0-9+\-\s()]{7,15}$/, '7 to 15 characters: digits, spaces, +, -, brackets')
    .optional()
    .describe('Optional contact number'),
};

const reference = z
  .string()
  .min(1)
  .describe('Either the student ID (e.g. CS2024001) or the 24-character database _id');

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

const fail = (err) => {
  let text;
  if (err instanceof ApiError) {
    text = `Error (${err.status}): ${err.message}`;
    if (err.errors) text += `\nField problems: ${JSON.stringify(err.errors)}`;
  } else {
    text = `Error: ${err.message}`;
  }
  return { isError: true, content: [{ type: 'text', text }] };
};

// Wraps a handler so every failure becomes a readable tool error instead of a crash.
const safe = (handler) => async (args) => {
  try {
    return ok(await handler(args));
  } catch (err) {
    return fail(err);
  }
};

function registerTools(server, api, { readOnly = false } = {}) {
  // Accepts a studentId like "CS2024001" or a database _id and returns the full record.
  async function resolveStudent(ref) {
    if (OBJECT_ID_PATTERN.test(ref)) return api.getStudent(ref);
    const wanted = ref.trim().toLowerCase();
    const match = (await api.listStudents()).find((s) => s.studentId.toLowerCase() === wanted);
    if (!match) throw new ApiError(`No student found with student ID "${ref}".`, 404);
    return match;
  }

  server.registerTool(
    'check_health',
    {
      title: 'Check platform health',
      description: 'Shows whether the Student API is up and whether its MongoDB database is connected.',
      annotations: { readOnlyHint: true },
    },
    safe(() => api.health())
  );

  server.registerTool(
    'list_students',
    {
      title: 'List or search students',
      description:
        'Lists students, newest first. Optional filters narrow the result. `query` matches name, email or student ID (case-insensitive).',
      inputSchema: {
        query: z.string().optional().describe('Text to look for in name, email or student ID'),
        department: z.string().optional().describe('Exact department name (case-insensitive)'),
        semester: z.number().int().min(1).max(12).optional().describe('Only this semester'),
        limit: z.number().int().min(1).max(500).default(50).describe('Maximum records to return'),
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ query, department, semester, limit = 50 }) => {
      let students = await api.listStudents();
      if (query) {
        const q = query.trim().toLowerCase();
        students = students.filter((s) =>
          [s.name, s.email, s.studentId].some((v) => String(v).toLowerCase().includes(q))
        );
      }
      if (department) {
        const d = department.trim().toLowerCase();
        students = students.filter((s) => s.department.toLowerCase() === d);
      }
      if (semester !== undefined) students = students.filter((s) => s.semester === semester);
      return { totalMatches: students.length, returned: Math.min(limit, students.length), students: students.slice(0, limit) };
    })
  );

  server.registerTool(
    'get_student',
    {
      title: 'Get one student',
      description: 'Fetches one student by student ID or database _id.',
      inputSchema: { student: reference },
      annotations: { readOnlyHint: true },
    },
    safe(({ student }) => resolveStudent(student))
  );

  server.registerTool(
    'student_stats',
    {
      title: 'Student statistics',
      description: 'Counts students overall, per department and per semester.',
      annotations: { readOnlyHint: true },
    },
    safe(async () => {
      const students = await api.listStudents();
      const tally = (key) =>
        students.reduce((acc, s) => ({ ...acc, [s[key]]: (acc[s[key]] || 0) + 1 }), {});
      return {
        total: students.length,
        byDepartment: tally('department'),
        bySemester: tally('semester'),
      };
    })
  );

  if (readOnly) return; // MCP_READ_ONLY=true: no write tools are exposed at all.

  server.registerTool(
    'create_student',
    {
      title: 'Add a student',
      description: 'Creates a new student record. Fails with 409 if the student ID already exists.',
      inputSchema: fields,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    safe((student) => api.createStudent(student))
  );

  server.registerTool(
    'update_student',
    {
      title: 'Update a student',
      description:
        'Changes only the fields you provide; everything else stays as it is. Identify the student by student ID or database _id.',
      inputSchema: {
        student: reference,
        studentId: fields.studentId.optional(),
        name: fields.name.optional(),
        email: fields.email.optional(),
        department: fields.department.optional(),
        semester: fields.semester.optional(),
        contact: fields.contact,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    safe(async ({ student, ...changes }) => {
      const current = await resolveStudent(student);
      // The REST endpoint replaces the whole record, so merge onto the current values.
      const merged = {
        studentId: current.studentId,
        name: current.name,
        email: current.email,
        department: current.department,
        semester: current.semester,
        contact: current.contact || '',
      };
      for (const [key, value] of Object.entries(changes)) {
        if (value !== undefined) merged[key] = value;
      }
      return api.updateStudent(current._id, merged);
    })
  );

  server.registerTool(
    'delete_student',
    {
      title: 'Delete a student',
      description:
        'Permanently deletes a student record. This cannot be undone. Set confirm to true only after the user has clearly asked for this deletion.',
      inputSchema: {
        student: reference,
        confirm: z.literal(true).describe('Must be true to proceed'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    safe(async ({ student }) => {
      const current = await resolveStudent(student);
      await api.deleteStudent(current._id);
      return { deleted: true, student: current };
    })
  );
}

module.exports = { registerTools };
