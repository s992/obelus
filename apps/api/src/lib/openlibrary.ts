import type { BookDetail, BookSearchResult } from "@obelus/shared";
import { TRPCError } from "@trpc/server";
import { and, eq, gt } from "drizzle-orm";
import { db, redis } from "../db/client.js";
import { openLibraryCache } from "../db/schema.js";
import { env } from "./env.js";

const SEARCH_TTL_SECONDS = 60 * 60 * 6;
const DETAIL_TTL_SECONDS = 60 * 60 * 24;
const BOOK_META_TTL_SECONDS = 60 * 60 * 24 * 365;
const FETCH_TIMEOUT_MS = 5000;
const AUTHOR_FETCH_CONCURRENCY = 8;
const OPENLIBRARY_USER_AGENT = `Obelus (${env.OPENLIBRARY_CONTACT_EMAIL})`;

type CachedBookMetadata = {
  key: string;
  title: string;
  authors: string[];
  covers: number[];
  publishDate: string | null;
};

const toBookMetaCacheKey = (bookKey: string): string => {
  const normalizedKey = bookKey.startsWith("/") ? bookKey : `/works/${bookKey}`;
  return `openlibrary:book-meta:${normalizedKey}`;
};

const fallbackDetail = (bookKey: string): BookDetail => {
  const normalizedKey = bookKey.startsWith("/") ? bookKey : `/works/${bookKey}`;
  const fallbackTitle = normalizedKey.split("/").filter(Boolean).pop() ?? normalizedKey;

  return {
    key: normalizedKey,
    title: fallbackTitle,
    description: null,
    authors: [],
    publishDate: null,
    covers: [],
    seriesName: null,
    seriesPosition: null,
    seriesBooks: [],
  };
};

const toDetailFromMetadata = (metadata: CachedBookMetadata): BookDetail => ({
  key: metadata.key,
  title: metadata.title,
  description: null,
  authors: metadata.authors,
  publishDate: metadata.publishDate,
  covers: metadata.covers,
  seriesName: null,
  seriesPosition: null,
  seriesBooks: [],
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

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": OPENLIBRARY_USER_AGENT,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

const mapWithConcurrency = async <T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> => {
  const output: R[] = [];
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < values.length) {
      const current = nextIndex;
      nextIndex += 1;
      output[current] = await mapper(values[current] as T);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return output;
};

export const seedBookMetadataEntries = async (
  entries: Array<{
    key: string;
    title: string;
    authors?: string[];
    covers?: number[];
    publishDate?: string | null;
  }>,
) => {
  const deduped = new Map<string, CachedBookMetadata>();

  for (const entry of entries) {
    const normalizedKey = entry.key.startsWith("/") ? entry.key : `/works/${entry.key}`;
    deduped.set(normalizedKey, {
      key: normalizedKey,
      title: entry.title,
      authors: entry.authors ?? [],
      covers: entry.covers ?? [],
      publishDate: entry.publishDate ?? null,
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

export const searchBooks = async (query: string): Promise<BookSearchResult[]> => {
  const key = `openlibrary:search:${query.toLowerCase().trim()}`;
  const cached = await getCache<BookSearchResult[]>(key);
  if (cached) {
    return cached;
  }

  const response = await fetchWithTimeout(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=25`,
  );

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `OpenLibrary search failed: ${response.status}`,
    });
  }

  const payload = (await response.json()) as {
    docs: Array<{
      key: string;
      title: string;
      author_name?: string[];
      first_publish_year?: number;
      cover_i?: number;
      series?: string[];
    }>;
  };

  const results: BookSearchResult[] = payload.docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    authorName: doc.author_name ?? [],
    firstPublishYear: doc.first_publish_year ?? null,
    coverId: doc.cover_i ?? null,
    series: doc.series ?? [],
  }));

  await Promise.all([
    setCache(key, results, SEARCH_TTL_SECONDS),
    seedBookMetadataEntries(
      results.map((entry) => ({
        key: entry.key,
        title: entry.title,
        authors: entry.authorName,
        covers: entry.coverId ? [entry.coverId] : [],
        publishDate: entry.firstPublishYear ? String(entry.firstPublishYear) : null,
      })),
    ),
  ]);

  return results;
};

const parseDescription = (description: unknown): string | null => {
  if (typeof description === "string") {
    return description;
  }
  if (
    description &&
    typeof description === "object" &&
    "value" in description &&
    typeof description.value === "string"
  ) {
    return description.value;
  }
  return null;
};

export const getBookDetail = async (
  bookKey: string,
  options?: {
    allowRemoteFetch?: boolean;
  },
): Promise<BookDetail> => {
  const allowRemoteFetch = options?.allowRemoteFetch ?? true;
  const normalizedKey = bookKey.startsWith("/") ? bookKey : `/works/${bookKey}`;
  const detailCacheKey = `openlibrary:detail:${normalizedKey}`;

  const cachedDetail = await getCache<BookDetail>(detailCacheKey);
  if (cachedDetail) {
    return cachedDetail;
  }

  const cachedMetadata = await getCachedBookMetadata(normalizedKey);
  if (cachedMetadata) {
    return toDetailFromMetadata(cachedMetadata);
  }

  if (!allowRemoteFetch) {
    return fallbackDetail(normalizedKey);
  }

  const response = await fetchWithTimeout(`https://openlibrary.org${normalizedKey}.json`);
  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `OpenLibrary detail failed: ${response.status}`,
    });
  }

  const payload = (await response.json()) as {
    key: string;
    title: string;
    description?: unknown;
    covers?: number[];
    first_publish_date?: string;
    authors?: Array<{ author?: { key?: string } }>;
  };

  const authorNames: string[] = [];

  if (Array.isArray(payload.authors)) {
    const authorKeys = payload.authors
      .map((author) => author.author?.key)
      .filter((value): value is string => Boolean(value));
    const resolved = await mapWithConcurrency(
      authorKeys,
      AUTHOR_FETCH_CONCURRENCY,
      async (authorKey) => {
        const authorResponse = await fetchWithTimeout(`https://openlibrary.org${authorKey}.json`);
        if (!authorResponse.ok) {
          return null;
        }
        const authorPayload = (await authorResponse.json()) as { name?: string };
        return authorPayload.name ?? null;
      },
    );
    for (const name of resolved) {
      if (name) {
        authorNames.push(name);
      }
    }
  }

  const detail: BookDetail = {
    key: payload.key,
    title: payload.title,
    description: parseDescription(payload.description),
    authors: authorNames,
    publishDate: payload.first_publish_date ?? null,
    covers: payload.covers ?? [],
    seriesName: null,
    seriesPosition: null,
    seriesBooks: [],
  };

  await Promise.all([
    setCache(detailCacheKey, detail, DETAIL_TTL_SECONDS),
    seedBookMetadataEntries([
      {
        key: detail.key,
        title: detail.title,
        authors: detail.authors,
        covers: detail.covers,
        publishDate: detail.publishDate,
      },
    ]),
  ]);

  return detail;
};

export const coverImageUrl = (coverId: number, size: "S" | "M" | "L" = "M") => {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};
