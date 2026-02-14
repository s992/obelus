import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const collectionVisibilityEnum = pgEnum("collection_visibility", ["private", "public"]);
export const judgmentEnum = pgEnum("judgment", ["Accepted", "Rejected"]);
export const authProviderEnum = pgEnum("auth_provider", ["local", "oauth2", "oidc"]);
export const goodreadsImportStatusEnum = pgEnum("goodreads_import_status", [
  "queued",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
]);
export const goodreadsIssueSeverityEnum = pgEnum("goodreads_issue_severity", ["warning", "error"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    collectionVisibility: collectionVisibilityEnum("collection_visibility")
      .notNull()
      .default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const passwords = pgTable("passwords", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderEnum("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerSubjectUnique: uniqueIndex("oauth_accounts_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
  }),
);

export const oauthLoginStates = pgTable(
  "oauth_login_states",
  {
    state: text("state").primaryKey(),
    nonce: text("nonce").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => ({
    expiresIdx: index("oauth_login_states_expires_idx").on(table.expiresAt),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const readingEntries = pgTable(
  "reading_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookKey: text("book_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    progressPercent: integer("progress_percent"),
    judgment: judgmentEnum("judgment"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userBookIdx: index("reading_entries_user_book_idx").on(table.userId, table.bookKey),
  }),
);

export const toReadEntries = pgTable(
  "to_read_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookKey: text("book_key").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
    priority: integer("priority"),
    notes: text("notes"),
  },
  (table) => ({
    userBookUnique: uniqueIndex("to_read_entries_user_book_unique").on(table.userId, table.bookKey),
  }),
);

export const openLibraryCache = pgTable(
  "open_library_cache",
  {
    key: text("key").primaryKey(),
    payload: text("payload").notNull(),
    cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isImage: boolean("is_image").notNull().default(false),
  },
  (table) => ({
    expiresIdx: index("open_library_cache_expires_idx").on(table.expiresAt),
  }),
);

export const goodreadsImports = pgTable(
  "goodreads_imports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: goodreadsImportStatusEnum("status").notNull().default("queued"),
    filename: text("filename").notNull(),
    optionsJson: text("options_json").notNull(),
    csvPayload: text("csv_payload").notNull(),
    totalRows: integer("total_rows").notNull().default(0),
    processedRows: integer("processed_rows").notNull().default(0),
    importedRows: integer("imported_rows").notNull().default(0),
    failedRows: integer("failed_rows").notNull().default(0),
    warningRows: integer("warning_rows").notNull().default(0),
    summaryJson: text("summary_json").notNull().default("{}"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("goodreads_imports_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export const goodreadsImportIssues = pgTable(
  "goodreads_import_issues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importId: uuid("import_id")
      .notNull()
      .references(() => goodreadsImports.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    bookTitle: text("book_title").notNull(),
    author: text("author").notNull(),
    severity: goodreadsIssueSeverityEnum("severity").notNull(),
    code: text("code").notNull(),
    message: text("message").notNull(),
    inference: text("inference"),
    rawRow: text("raw_row"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    importIdx: index("goodreads_import_issues_import_idx").on(table.importId, table.rowNumber),
  }),
);
