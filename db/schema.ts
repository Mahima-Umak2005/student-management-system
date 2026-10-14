import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: serial().primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text().notNull(),
  email: text().notNull(),
  department: text().notNull(),
  semester: integer().notNull(),
  contact: text().notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
