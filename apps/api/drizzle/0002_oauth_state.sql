CREATE TABLE "oauth_login_states" (
  "state" text PRIMARY KEY NOT NULL,
  "nonce" text NOT NULL,
  "code_verifier" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "oauth_login_states_expires_idx" ON "oauth_login_states" USING btree ("expires_at");
