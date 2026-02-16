import { seriesDetailSchema } from "@obelus/shared";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { readingEntries, toReadEntries } from "../db/schema.js";
import { getBookDetail, getSeriesDetail, searchBooks } from "../lib/hardcover.js";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc.js";

const DETAILS_BY_KEYS_BATCH_SIZE = 50;
const DETAILS_BY_KEYS_MAX_KEYS = 500;

type ResolveDetail<TDetail> = (key: string) => Promise<TDetail>;

type SeriesBook = {
  key: string;
  title: string;
  position: number | null;
  publishDate: string | null;
  coverUrl: string | null;
  description: string | null;
  authors: string[];
};

type ReadingSeriesState = {
  bookKey: string;
  startedAt: Date;
  finishedAt: Date | null;
  judgment: "Accepted" | "Rejected" | null;
};

type QueueSeriesState = {
  bookKey: string;
  priority: number | null;
};

const chunkKeys = (keys: string[], chunkSize: number): string[][] => {
  const chunks: string[][] = [];
  for (let index = 0; index < keys.length; index += chunkSize) {
    chunks.push(keys.slice(index, index + chunkSize));
  }
  return chunks;
};

const resolveDetailsByKeysInBatches = async <TDetail>(
  keys: string[],
  resolveDetail: ResolveDetail<TDetail>,
) => {
  const uniqueKeys = [...new Set(keys)];
  const detailEntries: Array<readonly [string, TDetail]> = [];

  for (const keyBatch of chunkKeys(uniqueKeys, DETAILS_BY_KEYS_BATCH_SIZE)) {
    const settledBatch = await Promise.allSettled(
      keyBatch.map(async (key) => [key, await resolveDetail(key)] as const),
    );

    for (const settledEntry of settledBatch) {
      if (settledEntry.status === "fulfilled") {
        detailEntries.push(settledEntry.value);
      }
    }
  }

  return Object.fromEntries(detailEntries);
};

const toIsoDate = (dateValue: Date): string => dateValue.toISOString().slice(0, 10);

const enrichSeriesBooksForUser = (
  books: SeriesBook[],
  reading: ReadingSeriesState[],
  queue: QueueSeriesState[],
) => {
  const readingByBook = new Map(reading.map((entry) => [entry.bookKey, entry]));
  const queueByBook = new Map(queue.map((entry) => [entry.bookKey, entry]));

  return books.map((book) => {
    const readingEntry = readingByBook.get(book.key);
    const queueEntry = queueByBook.get(book.key);

    if (readingEntry) {
      if (readingEntry.finishedAt) {
        return {
          ...book,
          userState: {
            status: "finished" as const,
            judgment: readingEntry.judgment ?? null,
            supportingText: `Finished ${toIsoDate(readingEntry.finishedAt)}`,
          },
        };
      }
      return {
        ...book,
        userState: {
          status: "reading" as const,
          judgment: readingEntry.judgment ?? null,
          supportingText: `Started ${toIsoDate(readingEntry.startedAt)}`,
        },
      };
    }

    if (queueEntry) {
      return {
        ...book,
        userState: {
          status: "planned" as const,
          judgment: null,
          supportingText:
            queueEntry.priority != null ? `Priority ${queueEntry.priority}` : "Planned",
        },
      };
    }

    return {
      ...book,
      userState: {
        status: "not-in-library" as const,
        judgment: null,
        supportingText: null,
      },
    };
  });
};

export const booksRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
      }),
    )
    .query(async ({ input }) => {
      return searchBooks(input.query);
    }),

  detail: publicProcedure
    .input(
      z.object({
        key: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      return getBookDetail(input.key, { allowRemoteFetch: true, allowMetadataFallback: false });
    }),

  detailsByKeys: publicProcedure
    .input(
      z.object({
        keys: z.array(z.string().min(1)).max(DETAILS_BY_KEYS_MAX_KEYS),
      }),
    )
    .mutation(async ({ input }) => {
      return resolveDetailsByKeysInBatches(input.keys, (key) =>
        getBookDetail(key, { allowRemoteFetch: false }),
      );
    }),

  seriesDetail: protectedProcedure
    .input(
      z.object({
        seriesId: z.number().int().positive(),
      }),
    )
    .output(seriesDetailSchema.nullable())
    .query(async ({ ctx, input }) => {
      const series = await getSeriesDetail(input.seriesId);
      if (!series) {
        return null;
      }

      const keys = series.books.map((book) => book.key);
      const [reading, queue] = await Promise.all([
        keys.length
          ? db
              .select({
                bookKey: readingEntries.bookKey,
                startedAt: readingEntries.startedAt,
                finishedAt: readingEntries.finishedAt,
                judgment: readingEntries.judgment,
              })
              .from(readingEntries)
              .where(
                and(eq(readingEntries.userId, ctx.user.id), inArray(readingEntries.bookKey, keys)),
              )
          : Promise.resolve([]),
        keys.length
          ? db
              .select({
                bookKey: toReadEntries.bookKey,
                priority: toReadEntries.priority,
              })
              .from(toReadEntries)
              .where(
                and(eq(toReadEntries.userId, ctx.user.id), inArray(toReadEntries.bookKey, keys)),
              )
          : Promise.resolve([]),
      ]);

      return {
        id: series.id,
        name: series.name,
        description: series.description,
        booksCount: series.booksCount,
        isCompleted: series.isCompleted,
        books: enrichSeriesBooksForUser(series.books, reading, queue),
      };
    }),

  coverUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
      }),
    )
    .query(({ input }) => input.url),
});

export const __testables = {
  chunkKeys,
  resolveDetailsByKeysInBatches,
  enrichSeriesBooksForUser,
  DETAILS_BY_KEYS_BATCH_SIZE,
  DETAILS_BY_KEYS_MAX_KEYS,
};
