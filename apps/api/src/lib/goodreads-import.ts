import {
  type GoodreadsImportOptions,
  type Judgment,
  type JudgmentWithUnjudged,
  goodreadsImportOptionsSchema,
} from "@obelus/shared";
import { TRPCError } from "@trpc/server";
import { parse as parseCsv } from "csv-parse/sync";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  goodreadsImportIssues,
  goodreadsImports,
  readingEntries,
  toReadEntries,
} from "../db/schema.js";
import {
  type BookLookupOutcome,
  type LookupFailureReason,
  getBookDetail,
  resolveBookKeyByIsbn,
  searchBookKeyByTitleAndAuthor,
  seedBookMetadataEntries as seedHardcoverBookMetadataEntries,
} from "./hardcover.js";

const REQUIRED_HEADERS = [
  "Title",
  "Author",
  "ISBN",
  "ISBN13",
  "My Rating",
  "Date Read",
  "Date Added",
  "Exclusive Shelf",
] as const;

type GoodreadsRow = Record<string, string>;

type GoodreadsRowWithMeta = {
  rowNumber: number;
  row: GoodreadsRow;
};

type IssueSeverity = "warning" | "error";

type AddIssueInput = {
  importId: string;
  rowNumber: number;
  bookTitle: string;
  author: string;
  severity: IssueSeverity;
  code: string;
  message: string;
  inference?: string;
  rawRow?: string;
};

type RowPlan = {
  target: "reading" | "to-read";
  startedAt: Date | null;
  finishedAt: Date | null;
  judgment: Judgment | null;
  warnings: Array<{ code: string; message: string; inference?: string }>;
};

const normalizeIsbn = (input: string | undefined): string | null => {
  if (!input) {
    return null;
  }

  const cleaned = input.replaceAll('"', "").replaceAll("=", "").replaceAll("-", "").trim();

  return cleaned.length > 0 ? cleaned : null;
};

const parseGoodreadsDate = (input: string | undefined): Date | null => {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const trimmed = input.trim();
  const slashParts = trimmed.split("/");
  if (slashParts.length === 3) {
    const [yearRaw, monthRaw, dayRaw] = slashParts;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      year > 0 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseRows = (csvPayload: string): GoodreadsRowWithMeta[] => {
  const records = parseCsv(csvPayload, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as GoodreadsRow[];

  const first = records[0];
  if (!first) {
    return [];
  }

  for (const header of REQUIRED_HEADERS) {
    if (!(header in first)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `CSV is missing required Goodreads header: ${header}`,
      });
    }
  }

  return records.map((row, index) => ({
    row,
    rowNumber: index + 2,
  }));
};

const toJudgmentFromMappedValue = (value: JudgmentWithUnjudged): Judgment | null => {
  if (value === "Unjudged") {
    return null;
  }
  return value;
};

const mapRatingToJudgment = (
  options: GoodreadsImportOptions,
  rating: number | null,
): Judgment | null => {
  if (!options.mapRatings || !rating || rating <= 0) {
    return null;
  }

  const ratingMap = {
    1: options.ratings.star1,
    2: options.ratings.star2,
    3: options.ratings.star3,
    4: options.ratings.star4,
    5: options.ratings.star5,
  } as const;

  const mapped = ratingMap[Math.min(5, Math.max(1, rating)) as 1 | 2 | 3 | 4 | 5];
  return toJudgmentFromMappedValue(mapped);
};

const buildRowPlan = (row: GoodreadsRow, options: GoodreadsImportOptions): RowPlan => {
  const warnings: RowPlan["warnings"] = [];
  const rawShelf = (row["Exclusive Shelf"] ?? "").trim().toLowerCase();
  const dateAdded = parseGoodreadsDate(row["Date Added"]);
  const dateRead = parseGoodreadsDate(row["Date Read"]);
  const ratingRaw = Number.parseInt((row["My Rating"] ?? "").trim(), 10);
  const rating = Number.isFinite(ratingRaw) ? ratingRaw : null;

  const judgment = mapRatingToJudgment(options, rating);

  const inferStartDate = (): Date => {
    if (dateAdded) {
      return dateAdded;
    }
    if (dateRead) {
      warnings.push({
        code: "INFERRED_START_DATE",
        message: "Inferred start date from finish date because start date was missing.",
        inference: "startedAt <- Date Read",
      });
      return dateRead;
    }

    warnings.push({
      code: "INFERRED_START_DATE",
      message: "Inferred start date as today because Goodreads dates were missing.",
      inference: "startedAt <- now",
    });
    return new Date();
  };

  if (rawShelf === "currently-reading") {
    return {
      target: "reading",
      startedAt: inferStartDate(),
      finishedAt: null,
      judgment,
      warnings,
    };
  }

  if (rawShelf === "read") {
    const startedAt = inferStartDate();
    let finishedAt = dateRead;
    if (!finishedAt) {
      finishedAt = startedAt;
      warnings.push({
        code: "INFERRED_END_DATE",
        message: "Inferred end date from start date because finish date was missing.",
        inference: "finishedAt <- startedAt",
      });
    }
    return {
      target: "reading",
      startedAt,
      finishedAt,
      judgment,
      warnings,
    };
  }

  if (rawShelf === "to-read") {
    return {
      target: "to-read",
      startedAt: null,
      finishedAt: null,
      judgment: null,
      warnings,
    };
  }

  if (dateRead) {
    const startedAt = inferStartDate();
    warnings.push({
      code: "INFERRED_STATUS",
      message: "Inferred finished status from date fields because Goodreads shelf was unknown.",
      inference: "status <- read",
    });
    return {
      target: "reading",
      startedAt,
      finishedAt: dateRead,
      judgment,
      warnings,
    };
  }

  warnings.push({
    code: "INFERRED_STATUS",
    message: "Inferred planned status because Goodreads shelf was unknown.",
    inference: "status <- to-read",
  });
  return {
    target: "to-read",
    startedAt: null,
    finishedAt: null,
    judgment: null,
    warnings,
  };
};

const pickLookupFailureReason = (outcomes: BookLookupOutcome[]): LookupFailureReason => {
  if (outcomes.some((outcome) => outcome.reason === "rate_limited")) {
    return "rate_limited";
  }

  if (outcomes.some((outcome) => outcome.reason === "upstream_error")) {
    return "upstream_error";
  }

  return "not_found";
};

const resolveBookKeyWithFallback = async (
  attempts: Array<() => Promise<BookLookupOutcome>>,
): Promise<{ resolvedBookKey: string | null; lookupOutcomes: BookLookupOutcome[] }> => {
  const lookupOutcomes: BookLookupOutcome[] = [];

  for (const attempt of attempts) {
    const outcome = await attempt();
    lookupOutcomes.push(outcome);
    if (outcome.reason === "matched" && outcome.bookKey) {
      return {
        resolvedBookKey: outcome.bookKey,
        lookupOutcomes,
      };
    }
  }

  return {
    resolvedBookKey: null,
    lookupOutcomes,
  };
};

const lookupFailureToIssue = (reason: LookupFailureReason): { code: string; message: string } => {
  if (reason === "rate_limited") {
    return {
      code: "HARDCOVER_RATE_LIMITED",
      message: "Could not import this book because Hardcover rate-limited lookup requests.",
    };
  }

  if (reason === "upstream_error") {
    return {
      code: "HARDCOVER_UNAVAILABLE",
      message: "Could not import this book because Hardcover was temporarily unavailable.",
    };
  }

  return {
    code: "BOOK_NOT_FOUND",
    message: "Could not match this book to Hardcover.",
  };
};

const addIssue = async (input: AddIssueInput) => {
  await db.insert(goodreadsImportIssues).values({
    importId: input.importId,
    rowNumber: input.rowNumber,
    bookTitle: input.bookTitle,
    author: input.author,
    severity: input.severity,
    code: input.code,
    message: input.message,
    inference: input.inference ?? null,
    rawRow: input.rawRow ?? null,
  });
};

const hydrateMatchedBookMetadata = async (
  input: {
    bookKey: string;
    title: string;
    author: string;
  },
  deps: {
    fetchFreshDetail: typeof getBookDetail;
    seedFallbackMetadata: typeof seedHardcoverBookMetadataEntries;
  } = {
    fetchFreshDetail: getBookDetail,
    seedFallbackMetadata: seedHardcoverBookMetadataEntries,
  },
): Promise<"hydrated" | "fallback_seeded"> => {
  try {
    await deps.fetchFreshDetail(input.bookKey, { forceRemoteFetch: true });
    return "hydrated";
  } catch {
    await deps.seedFallbackMetadata([
      {
        key: input.bookKey,
        title: input.title,
        authors: input.author ? [input.author] : [],
        publishDate: null,
        coverUrls: [],
      },
    ]);
    return "fallback_seeded";
  }
};

export const createQueuedGoodreadsImport = async (input: {
  userId: string;
  filename: string;
  csvPayload: string;
  options: GoodreadsImportOptions;
}) => {
  const rows = parseRows(input.csvPayload);

  const [created] = await db
    .insert(goodreadsImports)
    .values({
      userId: input.userId,
      filename: input.filename,
      csvPayload: input.csvPayload,
      optionsJson: JSON.stringify(input.options),
      totalRows: rows.length,
      summaryJson: JSON.stringify({
        totalRows: rows.length,
        processedRows: 0,
        importedRows: 0,
        failedRows: 0,
        warningRows: 0,
      }),
    })
    .returning();

  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create Goodreads import record.",
    });
  }

  return created;
};

const parseOptions = (raw: string): GoodreadsImportOptions => {
  const parsed = goodreadsImportOptionsSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Goodreads import options payload.",
    });
  }
  return parsed.data;
};

export const processGoodreadsImport = async (importId: string, userId: string): Promise<void> => {
  const [record] = await db
    .select()
    .from(goodreadsImports)
    .where(and(eq(goodreadsImports.id, importId), eq(goodreadsImports.userId, userId)))
    .limit(1);

  if (!record) {
    return;
  }

  if (record.status === "completed" || record.status === "completed_with_errors") {
    return;
  }

  const options = parseOptions(record.optionsJson);
  const rows = parseRows(record.csvPayload);

  await db
    .update(goodreadsImports)
    .set({
      status: "processing",
      startedAt: record.startedAt ?? new Date(),
      totalRows: rows.length,
      updatedAt: new Date(),
    })
    .where(eq(goodreadsImports.id, importId));

  const [existingReading, existingToRead] = await Promise.all([
    db.select().from(readingEntries).where(eq(readingEntries.userId, userId)),
    db.select().from(toReadEntries).where(eq(toReadEntries.userId, userId)),
  ]);

  const readingByBook = new Map(existingReading.map((entry) => [entry.bookKey, entry]));
  const toReadByBook = new Map(existingToRead.map((entry) => [entry.bookKey, entry]));

  let processedRows = 0;
  let importedRows = 0;
  let failedRows = 0;
  let warningRows = 0;

  try {
    for (const rowWithMeta of rows) {
      const title = (rowWithMeta.row.Title ?? "").trim() || "Unknown title";
      const author = (rowWithMeta.row.Author ?? "").trim() || "Unknown author";
      const rawRow = JSON.stringify(rowWithMeta.row);

      const plan = buildRowPlan(rowWithMeta.row, options);

      const isbn13 = normalizeIsbn(rowWithMeta.row.ISBN13);
      const isbn10 = normalizeIsbn(rowWithMeta.row.ISBN);

      const lookupAttempts: Array<() => Promise<BookLookupOutcome>> = [];
      if (isbn13) {
        lookupAttempts.push(() => resolveBookKeyByIsbn(isbn13));
      }
      if (isbn10) {
        lookupAttempts.push(() => resolveBookKeyByIsbn(isbn10));
      }
      lookupAttempts.push(() => searchBookKeyByTitleAndAuthor(title, author));
      const { resolvedBookKey, lookupOutcomes } = await resolveBookKeyWithFallback(lookupAttempts);

      for (const warning of plan.warnings) {
        warningRows += 1;
        await addIssue({
          importId,
          rowNumber: rowWithMeta.rowNumber,
          bookTitle: title,
          author,
          severity: "warning",
          code: warning.code,
          message: warning.message,
          inference: warning.inference,
          rawRow,
        });
      }

      if (!resolvedBookKey) {
        failedRows += 1;
        processedRows += 1;
        const failureReason = pickLookupFailureReason(lookupOutcomes);
        const issue = lookupFailureToIssue(failureReason);
        await addIssue({
          importId,
          rowNumber: rowWithMeta.rowNumber,
          bookTitle: title,
          author,
          severity: "error",
          code: issue.code,
          message: issue.message,
          rawRow,
        });
      } else {
        const metadataHydrationResult = await hydrateMatchedBookMetadata({
          bookKey: resolvedBookKey,
          title,
          author,
        });
        if (metadataHydrationResult === "fallback_seeded") {
          warningRows += 1;
          await addIssue({
            importId,
            rowNumber: rowWithMeta.rowNumber,
            bookTitle: title,
            author,
            severity: "warning",
            code: "HARDCOVER_METADATA_UNAVAILABLE",
            message: "Matched book, but fresh Hardcover metadata could not be fetched.",
            rawRow,
          });
        }

        if (plan.target === "reading") {
          const existing = readingByBook.get(resolvedBookKey);

          if (existing) {
            const nextFinishedAt = existing.finishedAt ?? plan.finishedAt;
            const nextJudgment = existing.judgment ?? plan.judgment;
            const shouldUpdate =
              (nextFinishedAt?.toISOString() ?? null) !==
                (existing.finishedAt?.toISOString() ?? null) || nextJudgment !== existing.judgment;

            if (shouldUpdate) {
              const [updated] = await db
                .update(readingEntries)
                .set({
                  finishedAt: nextFinishedAt,
                  judgment: nextJudgment,
                  updatedAt: new Date(),
                })
                .where(eq(readingEntries.id, existing.id))
                .returning();

              if (updated) {
                readingByBook.set(resolvedBookKey, updated);
              }
            }
          } else {
            const startedAt = plan.startedAt ?? new Date();
            const [created] = await db
              .insert(readingEntries)
              .values({
                userId,
                bookKey: resolvedBookKey,
                startedAt,
                finishedAt: plan.finishedAt,
                progressPercent: null,
                judgment: plan.judgment,
                notes: null,
              })
              .returning();

            if (created) {
              readingByBook.set(resolvedBookKey, created);
            }
          }

          const existingQueue = toReadByBook.get(resolvedBookKey);
          if (existingQueue) {
            await db.delete(toReadEntries).where(eq(toReadEntries.id, existingQueue.id));
            toReadByBook.delete(resolvedBookKey);
          }

          importedRows += 1;
          processedRows += 1;
        } else {
          if (readingByBook.has(resolvedBookKey)) {
            warningRows += 1;
            await addIssue({
              importId,
              rowNumber: rowWithMeta.rowNumber,
              bookTitle: title,
              author,
              severity: "warning",
              code: "READING_RECORD_ALREADY_EXISTS",
              message: "Kept existing reading record and skipped planned status update.",
              rawRow,
            });
          } else {
            const existingQueue = toReadByBook.get(resolvedBookKey);
            if (!existingQueue) {
              const addedAt = parseGoodreadsDate(rowWithMeta.row["Date Added"]) ?? new Date();
              const [queueRow] = await db
                .insert(toReadEntries)
                .values({
                  userId,
                  bookKey: resolvedBookKey,
                  addedAt,
                  priority: null,
                  notes: null,
                })
                .onConflictDoNothing({
                  target: [toReadEntries.userId, toReadEntries.bookKey],
                })
                .returning();

              if (queueRow) {
                toReadByBook.set(resolvedBookKey, queueRow);
              }
            }
          }

          importedRows += 1;
          processedRows += 1;
        }
      }

      await db
        .update(goodreadsImports)
        .set({
          processedRows,
          importedRows,
          failedRows,
          warningRows,
          summaryJson: JSON.stringify({
            totalRows: rows.length,
            processedRows,
            importedRows,
            failedRows,
            warningRows,
          }),
          updatedAt: new Date(),
        })
        .where(eq(goodreadsImports.id, importId));
    }

    const finalStatus = failedRows > 0 || warningRows > 0 ? "completed_with_errors" : "completed";
    await db
      .update(goodreadsImports)
      .set({
        status: finalStatus,
        processedRows,
        importedRows,
        failedRows,
        warningRows,
        summaryJson: JSON.stringify({
          totalRows: rows.length,
          processedRows,
          importedRows,
          failedRows,
          warningRows,
        }),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(goodreadsImports.id, importId));
  } catch (error) {
    await db
      .update(goodreadsImports)
      .set({
        status: "failed",
        processedRows,
        importedRows,
        failedRows: failedRows + 1,
        warningRows,
        summaryJson: JSON.stringify({
          totalRows: rows.length,
          processedRows,
          importedRows,
          failedRows: failedRows + 1,
          warningRows,
        }),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(goodreadsImports.id, importId));

    await addIssue({
      importId,
      rowNumber: 1,
      bookTitle: "Import",
      author: "System",
      severity: "error",
      code: "IMPORT_RUNTIME_ERROR",
      message: error instanceof Error ? error.message : "Import failed due to an unknown error.",
    });

    throw error;
  }
};

const parseSummary = (summaryJson: string) => {
  try {
    const parsed = JSON.parse(summaryJson) as {
      totalRows?: number;
      processedRows?: number;
      importedRows?: number;
      failedRows?: number;
      warningRows?: number;
    };

    return {
      totalRows: parsed.totalRows ?? 0,
      processedRows: parsed.processedRows ?? 0,
      importedRows: parsed.importedRows ?? 0,
      failedRows: parsed.failedRows ?? 0,
      warningRows: parsed.warningRows ?? 0,
    };
  } catch {
    return {
      totalRows: 0,
      processedRows: 0,
      importedRows: 0,
      failedRows: 0,
      warningRows: 0,
    };
  }
};

export const getGoodreadsImport = async (importId: string, userId: string) => {
  const [record] = await db
    .select()
    .from(goodreadsImports)
    .where(and(eq(goodreadsImports.id, importId), eq(goodreadsImports.userId, userId)))
    .limit(1);

  if (!record) {
    return null;
  }

  const issues = await db
    .select()
    .from(goodreadsImportIssues)
    .where(eq(goodreadsImportIssues.importId, record.id))
    .orderBy(desc(goodreadsImportIssues.rowNumber))
    .limit(200);

  return {
    id: record.id,
    status: record.status,
    filename: record.filename,
    optionsJson: record.optionsJson,
    summary: parseSummary(record.summaryJson),
    startedAt: record.startedAt?.toISOString() ?? null,
    finishedAt: record.finishedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    issues: issues.map((issue) => ({
      id: issue.id,
      rowNumber: issue.rowNumber,
      bookTitle: issue.bookTitle,
      author: issue.author,
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      inference: issue.inference,
      rawRow: issue.rawRow,
      createdAt: issue.createdAt.toISOString(),
    })),
  };
};

export const listGoodreadsImports = async (userId: string) => {
  const rows = await db
    .select()
    .from(goodreadsImports)
    .where(eq(goodreadsImports.userId, userId))
    .orderBy(desc(goodreadsImports.createdAt))
    .limit(20);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    filename: row.filename,
    optionsJson: row.optionsJson,
    summary: parseSummary(row.summaryJson),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const parseGoodreadsImportOptions = (raw: unknown): GoodreadsImportOptions => {
  const parsed = goodreadsImportOptionsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Goodreads import options.",
    });
  }
  return parsed.data;
};

export const __testables = {
  parseGoodreadsDate,
  normalizeIsbn,
  buildRowPlan,
  resolveBookKeyWithFallback,
  hydrateMatchedBookMetadata,
};
