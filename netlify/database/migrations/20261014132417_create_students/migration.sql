CREATE TABLE "students" (
	"id" serial PRIMARY KEY,
	"student_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"department" text NOT NULL,
	"semester" integer NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
