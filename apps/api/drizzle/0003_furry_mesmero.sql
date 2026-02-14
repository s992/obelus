CREATE TYPE "public"."goodreads_import_status" AS ENUM('queued', 'processing', 'completed', 'completed_with_errors', 'failed');--> statement-breakpoint
CREATE TYPE "public"."goodreads_issue_severity" AS ENUM('warning', 'error');--> statement-breakpoint
CREATE TABLE "goodreads_import_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"book_title" text NOT NULL,
	"author" text NOT NULL,
	"severity" "goodreads_issue_severity" NOT NULL,
	"code" text NOT NULL,
	"message" text NOT NULL,
	"inference" text,
	"raw_row" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goodreads_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "goodreads_import_status" DEFAULT 'queued' NOT NULL,
	"filename" text NOT NULL,
	"options_json" text NOT NULL,
	"csv_payload" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"warning_rows" integer DEFAULT 0 NOT NULL,
	"summary_json" text DEFAULT '{}' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goodreads_import_issues" ADD CONSTRAINT "goodreads_import_issues_import_id_goodreads_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."goodreads_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goodreads_imports" ADD CONSTRAINT "goodreads_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goodreads_import_issues_import_idx" ON "goodreads_import_issues" USING btree ("import_id","row_number");--> statement-breakpoint
CREATE INDEX "goodreads_imports_user_created_idx" ON "goodreads_imports" USING btree ("user_id","created_at");--> statement-breakpoint
