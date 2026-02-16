CREATE TABLE "oauth_link_confirmations" (
	"token" text PRIMARY KEY NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_subject" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "oauth_link_confirmations_expires_idx" ON "oauth_link_confirmations" USING btree ("expires_at");