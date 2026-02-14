import type { BookDetail, BookSearchResult } from "@obelus/shared";
import { TRPCError } from "@trpc/server";
import { and, eq, gt } from "drizzle-orm";
import { db, redis } from "../db/client.js";
import { openLibraryCache } from "../db/schema.js";
import { env } from "./env.js";

const SEARCH_TTL_SECONDS = 60 * 60 * 6;
const DETAIL_TTL_SECONDS = 60 * 60 * 24;
const BOOK_META_TTL_SECONDS = 60 * 60 * 24 * 365;
const FETCH_TIMEOUT_MS = 7000;
const MIN_REQUEST_INTERVAL_MS = 1100;
const MAX_BACKOFF_MS = 12000;

export type LookupFailureReason = "not_found" | "rate_limited" | "upstream_error";
export type BookLookupOutcome = {
  bookKey: string | null;
  reason: "matched" | LookupFailureReason;
};

type CachedBookMetadata = {
  key: string;
  title: string;
  authors: string[];
  coverUrls: string[];
  publishDate: string | null;
  isbn13: string[];
  pages: number | null;
};

type GraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

const toBookMetaCacheKey = (bookKey: string): string => `hardcover:book-meta:${bookKey}`;

const toBookKey = (hardcoverBookId: number): string => `hc:${hardcoverBookId}`;

const parseBookKey = (bookKey: string): number | null => {
  if (bookKey.startsWith("hc:")) {
    const parsed = Number.parseInt(bookKey.slice(3), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number.parseInt(bookKey, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const fallbackDetail = (bookKey: string): BookDetail => ({
  key: bookKey,
  title: bookKey,
  description: null,
  authors: [],
  publishDate: null,
  covers: [],
  coverUrl: null,
  seriesName: null,
  seriesPosition: null,
  seriesBooks: [],
  isbn_13: [],
  number_of_pages: null,
});

const toDetailFromMetadata = (metadata: CachedBookMetadata): BookDetail => ({
  key: metadata.key,
  title: metadata.title,
  description: null,
  authors: metadata.authors,
  publishDate: metadata.publishDate,
  covers: metadata.coverUrls,
  coverUrl: metadata.coverUrls[0] ?? null,
  seriesName: null,
  seriesPosition: null,
  seriesBooks: [],
  isbn_13: metadata.isbn13,
  number_of_pages: metadata.pages,
});

const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const redisValue = await redis.get(key);
    if (redisValue) {
      return JSON.parse(redisValue) as T;
    }
  } catch {
    // Redis cache miss/failure falls back to Postgres cache table.
  }

  const [cached] = await db
    .select()
    .from(openLibraryCache)
    .where(and(eq(openLibraryCache.key, key), gt(openLibraryCache.expiresAt, new Date())))
    .limit(1);

  if (!cached) {
    return null;
  }

  const parsed = JSON.parse(cached.payload) as T;
  try {
    await redis.set(key, cached.payload, "EX", 300);
  } catch {
    // Ignore Redis write errors; Postgres cache remains authoritative.
  }
  return parsed;
};

const setCache = async (key: string, value: unknown, ttlSeconds: number) => {
  const payload = JSON.stringify(value);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  try {
    await redis.set(key, payload, "EX", ttlSeconds);
  } catch {
    // Ignore Redis write errors; Postgres cache remains authoritative.
  }

  await db
    .insert(openLibraryCache)
    .values({ key, payload, expiresAt })
    .onConflictDoUpdate({
      target: openLibraryCache.key,
      set: { payload, expiresAt, cachedAt: new Date() },
    });
};

let lastRequestAt = 0;

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const postGraphQl = async <TData>(query: string, variables: Record<string, unknown>) => {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }

  let attempt = 0;
  while (true) {
    attempt += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      lastRequestAt = Date.now();
      const response = await fetch(env.HARDCOVER_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.HARDCOVER_API_TOKEN}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (isRetryableStatus(response.status) && attempt < 5) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader
          ? Number.parseInt(retryAfterHeader, 10)
          : Number.NaN;
        const computedBackoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt - 1));
        const retryAfter = Number.isFinite(retryAfterSeconds)
          ? Math.min(MAX_BACKOFF_MS, retryAfterSeconds * 1000)
          : computedBackoff;
        await sleep(retryAfter + Math.floor(Math.random() * 200));
        continue;
      }

      if (!response.ok) {
        // Fail fast for non-retryable HTTP responses (e.g. auth/config issues).
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Hardcover request failed: ${response.status}`,
        });
      }

      const payload = (await response.json()) as GraphQlResponse<TData>;
      if (payload.errors?.length) {
        const message = payload.errors[0]?.message ?? "Hardcover GraphQL request failed.";
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }

      if (!payload.data) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Hardcover returned no data." });
      }

      return payload.data;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      if (attempt >= 5) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Hardcover request failed repeatedly.",
        });
      }
      const backoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt - 1));
      await sleep(backoff + Math.floor(Math.random() * 200));
    } finally {
      clearTimeout(timeout);
    }
  }
};

const coerceString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const extractCoverUrl = (book: Record<string, unknown>): string | null => {
  const image = book.image;
  if (image && typeof image === "object") {
    const imageUrl = coerceString((image as Record<string, unknown>).url);
    if (imageUrl) {
      return imageUrl;
    }
  }

  const cachedImage = book.cached_image;
  if (cachedImage && typeof cachedImage === "object") {
    return coerceString((cachedImage as Record<string, unknown>).url);
  }

  return null;
};

const extractAuthors = (book: Record<string, unknown>): string[] => {
  const contributions = Array.isArray(book.contributions) ? book.contributions : [];
  const names = contributions
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const author = (entry as Record<string, unknown>).author;
      if (!author || typeof author !== "object") {
        return null;
      }
      return coerceString((author as Record<string, unknown>).name);
    })
    .filter((name): name is string => Boolean(name));

  return unique(names);
};

const mapBookNodeToSearchResult = (book: Record<string, unknown>): BookSearchResult | null => {
  const id = Number(book.id);
  const title = coerceString(book.title);

  if (!Number.isFinite(id) || !title) {
    return null;
  }

  const authorNames = extractAuthors(book);
  const coverUrl = extractCoverUrl(book);
  const releaseYear = Number(book.release_year);
  const featuredSeries = book.cached_featured_series;
  const series = (() => {
    if (!featuredSeries) {
      return [];
    }
    if (Array.isArray(featuredSeries)) {
      return featuredSeries
        .map((entry) =>
          entry && typeof entry === "object"
            ? coerceString((entry as Record<string, unknown>).name)
            : null,
        )
        .filter((name): name is string => Boolean(name));
    }
    if (typeof featuredSeries === "object") {
      const name = coerceString((featuredSeries as Record<string, unknown>).name);
      return name ? [name] : [];
    }
    return [];
  })();

  return {
    key: toBookKey(id),
    title,
    authorName: authorNames,
    firstPublishYear: Number.isFinite(releaseYear) ? releaseYear : null,
    coverUrl,
    series,
  };
};

const fetchBooksByIds = async (ids: number[]): Promise<BookSearchResult[]> => {
  if (ids.length === 0) {
    return [];
  }

  const data = await postGraphQl<{
    books?: Array<Record<string, unknown>>;
  }>(
    `query BooksByIds($ids: [Int!]) {
      books(where: { id: { _in: $ids } }, limit: 25) {
        id
        title
        release_year
        cached_featured_series
        image {
          url
        }
        cached_image
        contributions(limit: 6) { author { name } }
      }
    }`,
    { ids },
  );
  const byId = new Map(
    (data.books ?? [])
      .map(mapBookNodeToSearchResult)
      .filter((entry): entry is BookSearchResult => Boolean(entry))
      .map((entry) => [entry.key, entry] as const),
  );

  return ids
    .map((id) => byId.get(toBookKey(id)))
    .filter((entry): entry is BookSearchResult => Boolean(entry));
};

const parseSearchIds = (rawIds: unknown): number[] => {
  if (!Array.isArray(rawIds)) {
    return [];
  }
  return rawIds
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value));
};

const searchViaIds = async (query: string): Promise<BookSearchResult[]> => {
  const data = await postGraphQl<{
    search?: {
      ids?: unknown;
    };
  }>(
    `query SearchBookIds($query: String!) {
      search(query: $query, query_type: "Book", per_page: 25, page: 1) {
        ids
      }
    }`,
    { query },
  );

  const ids = parseSearchIds(data.search?.ids);
  return fetchBooksByIds(ids);
};

const searchViaRawResults = async (query: string): Promise<BookSearchResult[]> => {
  const data = await postGraphQl<{
    search?: {
      results?: unknown;
    };
  }>(
    `query SearchBooksRaw($query: String!) {
      search(query: $query, query_type: "Book", per_page: 25, page: 1) {
        results
      }
    }`,
    { query },
  );

  const results = Array.isArray(data.search?.results) ? data.search?.results : [];
  return results
    .map(mapBookNodeToSearchResult)
    .filter((entry): entry is BookSearchResult => Boolean(entry));
};

const shouldUseRawResultsFallback = (error: unknown): boolean => {
  if (!(error instanceof TRPCError)) {
    return true;
  }

  const message = error.message.toLowerCase();
  // Only fallback for GraphQL schema/query-shape incompatibilities on the `search` endpoint.
  return (
    message.includes("cannot query field") ||
    message.includes("unknown argument") ||
    message.includes("validation-failed")
  );
};

export const searchBooks = async (query: string): Promise<BookSearchResult[]> => {
  const normalizedQuery = query.toLowerCase().trim();
  const key = `hardcover:search:${normalizedQuery}`;
  const cached = await getCache<BookSearchResult[]>(key);
  if (cached) {
    return cached;
  }

  let results: BookSearchResult[] = [];
  try {
    results = await searchViaIds(normalizedQuery);
  } catch (error) {
    if (!shouldUseRawResultsFallback(error)) {
      throw error;
    }
    results = await searchViaRawResults(normalizedQuery);
  }

  await Promise.all([
    setCache(key, results, SEARCH_TTL_SECONDS),
    seedBookMetadataEntries(
      results.map((entry) => ({
        key: entry.key,
        title: entry.title,
        authors: entry.authorName,
        coverUrls: entry.coverUrl ? [entry.coverUrl] : [],
        publishDate: entry.firstPublishYear ? String(entry.firstPublishYear) : null,
      })),
    ),
  ]);

  return results;
};

export const seedBookMetadataEntries = async (
  entries: Array<{
    key: string;
    title: string;
    authors?: string[];
    coverUrls?: string[];
    publishDate?: string | null;
    isbn13?: string[];
    pages?: number | null;
  }>,
) => {
  const deduped = new Map<string, CachedBookMetadata>();

  for (const entry of entries) {
    deduped.set(entry.key, {
      key: entry.key,
      title: entry.title,
      authors: entry.authors ?? [],
      coverUrls: entry.coverUrls ?? [],
      publishDate: entry.publishDate ?? null,
      isbn13: entry.isbn13 ?? [],
      pages: entry.pages ?? null,
    });
  }

  await Promise.all(
    [...deduped.values()].map((entry) =>
      setCache(toBookMetaCacheKey(entry.key), entry, BOOK_META_TTL_SECONDS),
    ),
  );
};

const getCachedBookMetadata = async (bookKey: string): Promise<CachedBookMetadata | null> => {
  return getCache<CachedBookMetadata>(toBookMetaCacheKey(bookKey));
};

const mapBookNodeToDetail = (book: Record<string, unknown>, key: string): BookDetail => {
  const editions = Array.isArray(book.editions) ? book.editions : [];
  const isbn13 = unique(
    editions
      .map((edition) =>
        edition && typeof edition === "object"
          ? coerceString((edition as Record<string, unknown>).isbn_13)
          : null,
      )
      .filter((value): value is string => Boolean(value)),
  );

  const pages = editions
    .map((edition) =>
      edition && typeof edition === "object"
        ? Number((edition as Record<string, unknown>).pages)
        : Number.NaN,
    )
    .find((value) => Number.isFinite(value));

  const releaseDate =
    editions
      .map((edition) =>
        edition && typeof edition === "object"
          ? coerceString((edition as Record<string, unknown>).release_date)
          : null,
      )
      .find((value): value is string => Boolean(value)) ?? coerceString(book.release_date);

  const coverUrl = extractCoverUrl(book);
  const featuredSeries = book.cached_featured_series;
  const firstSeriesName =
    featuredSeries && typeof featuredSeries === "object"
      ? coerceString((featuredSeries as Record<string, unknown>).name)
      : null;

  const detail: BookDetail = {
    key,
    title: coerceString(book.title) ?? key,
    description: coerceString(book.description),
    authors: extractAuthors(book),
    publishDate: releaseDate ?? null,
    covers: coverUrl ? [coverUrl] : [],
    coverUrl,
    seriesName: firstSeriesName,
    seriesPosition: null,
    seriesBooks: [],
    isbn_13: isbn13,
    number_of_pages: Number.isFinite(pages ?? Number.NaN) ? Number(pages) : null,
  };

  return detail;
};

export const getBookDetail = async (
  bookKey: string,
  options?: {
    allowRemoteFetch?: boolean;
    forceRemoteFetch?: boolean;
  },
): Promise<BookDetail> => {
  const allowRemoteFetch = options?.allowRemoteFetch ?? true;
  const forceRemoteFetch = options?.forceRemoteFetch ?? false;
  const detailCacheKey = `hardcover:detail:${bookKey}`;

  if (!forceRemoteFetch) {
    const cachedDetail = await getCache<BookDetail>(detailCacheKey);
    if (cachedDetail) {
      return cachedDetail;
    }

    const cachedMetadata = await getCachedBookMetadata(bookKey);
    if (cachedMetadata) {
      return toDetailFromMetadata(cachedMetadata);
    }
  }

  if (!allowRemoteFetch) {
    return fallbackDetail(bookKey);
  }

  const hardcoverId = parseBookKey(bookKey);
  if (!hardcoverId) {
    return fallbackDetail(bookKey);
  }

  const data = await postGraphQl<{
    books?: Array<Record<string, unknown>>;
  }>(
    `query BookDetail($id: Int!) {
      books(where: { id: { _eq: $id } }, limit: 1) {
        id
        title
        description
        release_date
        cached_featured_series
        image {
          url
        }
        cached_image
        contributions(limit: 12) { author { name } }
        editions(limit: 5) {
          isbn_13
          pages
          release_date
        }
      }
    }`,
    { id: hardcoverId },
  );

  const node = data.books?.[0];
  if (!node) {
    return fallbackDetail(bookKey);
  }

  const detail = mapBookNodeToDetail(node, toBookKey(hardcoverId));

  await Promise.all([
    setCache(detailCacheKey, detail, DETAIL_TTL_SECONDS),
    seedBookMetadataEntries([
      {
        key: detail.key,
        title: detail.title,
        authors: detail.authors,
        coverUrls: detail.covers,
        publishDate: detail.publishDate,
        isbn13: detail.isbn_13 ?? [],
        pages: detail.number_of_pages ?? null,
      },
    ]),
  ]);

  return detail;
};

const classifyHardcoverError = (error: unknown): LookupFailureReason => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("429") || message.includes("rate")) {
    return "rate_limited";
  }
  return "upstream_error";
};

export const resolveBookKeyByIsbn = async (isbn: string): Promise<BookLookupOutcome> => {
  try {
    const data = await postGraphQl<{
      editions?: Array<{ book_id?: number }>;
    }>(
      `query ResolveByIsbn($isbn: String!) {
        editions(where: { _or: [{ isbn_10: { _eq: $isbn } }, { isbn_13: { _eq: $isbn } }] }, limit: 1) {
          book_id
        }
      }`,
      { isbn },
    );

    const bookId = Number(data.editions?.[0]?.book_id);
    if (!Number.isFinite(bookId)) {
      return { bookKey: null, reason: "not_found" };
    }

    return {
      bookKey: toBookKey(bookId),
      reason: "matched",
    };
  } catch (error) {
    return {
      bookKey: null,
      reason: classifyHardcoverError(error),
    };
  }
};

export const searchBookKeyByTitleAndAuthor = async (
  title: string,
  author: string,
): Promise<BookLookupOutcome> => {
  const query = `${title} ${author}`.trim();
  if (query.length < 2) {
    return { bookKey: null, reason: "not_found" };
  }

  try {
    const results = await searchBooks(query);
    if (results.length === 0) {
      return { bookKey: null, reason: "not_found" };
    }

    const normalizedTitle = title.trim().toLowerCase();
    const normalizedAuthor = author.trim().toLowerCase();

    const scored = results
      .map((entry) => {
        const resultTitle = entry.title.trim().toLowerCase();
        const resultAuthors = entry.authorName.map((name) => name.trim().toLowerCase());

        let score = 0;
        if (resultTitle === normalizedTitle) {
          score += 4;
        } else if (resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle)) {
          score += 2;
        }

        if (normalizedAuthor.length > 0) {
          const authorHit = resultAuthors.some(
            (name) => name.includes(normalizedAuthor) || normalizedAuthor.includes(name),
          );
          if (authorHit) {
            score += 3;
          }
        }

        return {
          key: entry.key,
          score,
        };
      })
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
  } catch (error) {
    return {
      bookKey: null,
      reason: classifyHardcoverError(error),
    };
  }
};
