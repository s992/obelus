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
import { env } from "./env.js";
import { seedBookMetadataEntries } from "./openlibrary.js";

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

type LookupFailureReason = "not_found" | "rate_limited" | "upstream_error";

type BookLookupOutcome = {
  bookKey: string | null;
  reason: "matched" | LookupFailureReason;
};

const FETCH_TIMEOUT_MS = 6000;
const MIN_REQUEST_INTERVAL_MS = 1200;
const MAX_BACKOFF_MS = 12000;

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

class OpenLibraryImportClient {
  private lastRequestAt = 0;
  private isbnCache = new Map<string, Promise<BookLookupOutcome>>();
  private queryCache = new Map<string, Promise<BookLookupOutcome>>();

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async throttledFetch(url: string): Promise<Response> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await this.sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
    }

    let attempt = 0;
    while (true) {
      attempt += 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        this.lastRequestAt = Date.now();
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": `Obelus (${env.OPENLIBRARY_CONTACT_EMAIL})`,
          },
        });

        if (response.status === 429 || response.status >= 500) {
          if (attempt < 5) {
            const retryAfterHeader = response.headers.get("retry-after");
            const retryAfterSeconds = retryAfterHeader
              ? Number.parseInt(retryAfterHeader, 10)
              : Number.NaN;
            const computedBackoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt - 1));
            const retryAfter = Number.isFinite(retryAfterSeconds)
              ? Math.min(MAX_BACKOFF_MS, retryAfterSeconds * 1000)
              : computedBackoff;
            const jitter = Math.floor(Math.random() * 200);
            await this.sleep(retryAfter + jitter);
            continue;
          }
        }

        return response;
      } catch {
        if (attempt >= 5) {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "OpenLibrary request failed repeatedly during Goodreads import.",
          });
        }

        const backoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt - 1));
        const jitter = Math.floor(Math.random() * 200);
        await this.sleep(backoff + jitter);
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  private normalizeWorkKey(input: string | null | undefined): string | null {
    if (!input) {
      return null;
    }
    if (input.startsWith("/works/")) {
      return input;
    }
    return null;
  }

  private classifyLookupFailureStatus(response: Response): LookupFailureReason {
    if (response.status === 404) {
      return "not_found";
    }
    if (response.status === 429) {
      return "rate_limited";
    }
    return "upstream_error";
  }

  async resolveBookKeyByIsbn(isbn: string): Promise<BookLookupOutcome> {
    const cached = this.isbnCache.get(isbn);
    if (cached) {
      return cached;
    }

    const request: Promise<BookLookupOutcome> = (async (): Promise<BookLookupOutcome> => {
      const response = await this.throttledFetch(
        `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`,
      );

      if (!response.ok) {
        return {
          bookKey: null,
          reason: this.classifyLookupFailureStatus(response),
        };
      }

      const payload = (await response.json()) as {
        works?: Array<{ key?: string }>;
        key?: string;
      };

      const workKey = this.normalizeWorkKey(payload.works?.[0]?.key);
      if (workKey) {
        return {
          bookKey: workKey,
          reason: "matched",
        };
      }

      const fallbackKey = this.normalizeWorkKey(payload.key ?? null);
      if (fallbackKey) {
        return {
          bookKey: fallbackKey,
          reason: "matched",
        };
      }

      return {
        bookKey: null,
        reason: "not_found",
      };
    })();

    this.isbnCache.set(isbn, request);
    return request;
  }

  async searchBookKeyByTitleAndAuthor(title: string, author: string): Promise<BookLookupOutcome> {
    const query = `${title} ${author}`.trim();
    if (query.length < 2) {
      return {
        bookKey: null,
        reason: "not_found",
      };
    }

    const normalizedQuery = query.toLowerCase();
    const cached = this.queryCache.get(normalizedQuery);
    if (cached) {
      return cached;
    }

    const request: Promise<BookLookupOutcome> = (async (): Promise<BookLookupOutcome> => {
      const response = await this.throttledFetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`,
      );

      if (!response.ok) {
        return {
          bookKey: null,
          reason: this.classifyLookupFailureStatus(response),
        };
      }

      const payload = (await response.json()) as {
        docs?: Array<{ key?: string; title?: string; author_name?: string[] }>;
      };

      const docs = payload.docs ?? [];
      if (docs.length === 0) {
        return {
          bookKey: null,
          reason: "not_found",
        };
      }

      const normalizedTitle = title.trim().toLowerCase();
      const normalizedAuthor = author.trim().toLowerCase();

      const scored = docs
        .map((doc) => {
          const docTitle = (doc.title ?? "").trim().toLowerCase();
          const docAuthors = (doc.author_name ?? []).map((name) => name.trim().toLowerCase());

          let score = 0;
          if (docTitle === normalizedTitle) {
            score += 4;
          } else if (docTitle.includes(normalizedTitle) || normalizedTitle.includes(docTitle)) {
            score += 2;
          }

          if (normalizedAuthor.length > 0) {
            const authorHit = docAuthors.some(
              (name) => name.includes(normalizedAuthor) || normalizedAuthor.includes(name),
            );
            if (authorHit) {
              score += 3;
            }
          }

          return {
            key: this.normalizeWorkKey(doc.key ?? null),
            score,
          };
        })
        .filter((entry): entry is { key: string; score: number } => Boolean(entry.key))
        .sort((a, b) => b.score - a.score);

      const top = scored[0];
      if (!top || top.score < 3) {
        return {
          bookKey: null,
          reason: "not_found",
        };
      }

      return {
        bookKey: top.key,
        reason: "matched",
      };
    })();

    this.queryCache.set(normalizedQuery, request);
    return request;
  }
}

const pickLookupFailureReason = (outcomes: BookLookupOutcome[]): LookupFailureReason => {
  if (outcomes.some((outcome) => outcome.reason === "rate_limited")) {
    return "rate_limited";
  }

  if (outcomes.some((outcome) => outcome.reason === "upstream_error")) {
    return "upstream_error";
  }

  return "not_found";
};

const lookupFailureToIssue = (reason: LookupFailureReason): { code: string; message: string } => {
  if (reason === "rate_limited") {
    return {
      code: "OPENLIBRARY_RATE_LIMITED",
      message: "Could not import this book because OpenLibrary rate-limited lookup requests.",
    };
  }

  if (reason === "upstream_error") {
    return {
      code: "OPENLIBRARY_UNAVAILABLE",
      message: "Could not import this book because OpenLibrary was temporarily unavailable.",
    };
  }

  return {
    code: "BOOK_NOT_FOUND",
    message: "Could not match this book to OpenLibrary.",
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

  const resolver = new OpenLibraryImportClient();

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

      const lookupOutcomes: BookLookupOutcome[] = [];
      if (isbn13) {
        lookupOutcomes.push(await resolver.resolveBookKeyByIsbn(isbn13));
      }
      if (isbn10) {
        lookupOutcomes.push(await resolver.resolveBookKeyByIsbn(isbn10));
      }
      lookupOutcomes.push(await resolver.searchBookKeyByTitleAndAuthor(title, author));

      const resolvedBookKey =
        lookupOutcomes.find((outcome) => outcome.reason === "matched")?.bookKey ?? null;

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
        await seedBookMetadataEntries([
          {
            key: resolvedBookKey,
            title,
            authors: author ? [author] : [],
            publishDate: null,
            covers: [],
          },
        ]);

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
};
