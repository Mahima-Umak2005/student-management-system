// REST API for students, backed by Netlify Database (Postgres).
// Keeps the same JSON shape as the original Express backend so the
// frontend works unchanged: { success, message?, data?, errors? }.
import type { Config } from "@netlify/functions";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { students } from "../../db/schema.js";
import validation from "../../backend/src/utils/validateStudent.js";

const { validateStudentInput } = validation as {
  validateStudentInput: (body: unknown) => {
    errors: Record<string, string>;
    value: Record<string, any>;
  };
};

type StudentRow = typeof students.$inferSelect;

// The frontend identifies records by `_id`.
const toClient = ({ id, ...rest }: StudentRow) => ({ _id: String(id), ...rest });

const json = (status: number, body: unknown) => Response.json(body, { status });
const fail = (status: number, message: string, errors?: Record<string, string>) =>
  json(status, { success: false, message, ...(errors ? { errors } : {}) });

const DUPLICATE_MESSAGE = "A student with this Student ID already exists.";
const isDuplicate = (err: any) => err?.code === "23505" || err?.cause?.code === "23505";

async function readInput(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { response: fail(400, "Request body is not valid JSON.") };
  }
  const { errors, value } = validateStudentInput(body);
  if (Object.keys(errors).length > 0) {
    return { response: fail(400, "Validation failed. Please check the highlighted fields.", errors) };
  }
  return { value: value as Omit<typeof students.$inferInsert, "id"> };
}

function parseId(raw: string | undefined) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default async (req: Request, context: { params: Record<string, string> }) => {
  const url = new URL(req.url);

  try {
    if (url.pathname === "/api/health") {
      await db.execute(sql`select 1`);
      return json(200, {
        success: true,
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    }

    const rawId = context.params?.id;

    if (rawId === undefined) {
      if (req.method === "GET") {
        const rows = await db.select().from(students).orderBy(desc(students.createdAt));
        return json(200, { success: true, count: rows.length, data: rows.map(toClient) });
      }
      if (req.method === "POST") {
        const { value, response } = await readInput(req);
        if (response) return response;
        const [row] = await db.insert(students).values(value!).returning();
        return json(201, { success: true, message: "Student added successfully.", data: toClient(row) });
      }
      return fail(405, "Method not allowed.");
    }

    const id = parseId(rawId);
    if (id === null) return fail(400, "Invalid student ID format.");

    if (req.method === "GET") {
      const [row] = await db.select().from(students).where(eq(students.id, id));
      if (!row) return fail(404, "Student not found.");
      return json(200, { success: true, data: toClient(row) });
    }
    if (req.method === "PUT") {
      const { value, response } = await readInput(req);
      if (response) return response;
      const [row] = await db
        .update(students)
        .set({ ...value!, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      if (!row) return fail(404, "Student not found.");
      return json(200, { success: true, message: "Student updated successfully.", data: toClient(row) });
    }
    if (req.method === "DELETE") {
      const [row] = await db.delete(students).where(eq(students.id, id)).returning({ id: students.id });
      if (!row) return fail(404, "Student not found.");
      return json(200, { success: true, message: "Student deleted successfully.", data: { _id: String(row.id) } });
    }
    return fail(405, "Method not allowed.");
  } catch (err) {
    if (isDuplicate(err)) return fail(409, DUPLICATE_MESSAGE, { studentId: DUPLICATE_MESSAGE });
    console.error(`Unhandled error on ${req.method} ${url.pathname}:`, err);
    return fail(500, "Something went wrong on the server. Please try again.");
  }
};

export const config: Config = {
  path: ["/api/health", "/api/students", "/api/students/:id"],
};
