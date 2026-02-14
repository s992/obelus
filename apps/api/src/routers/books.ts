import { z } from "zod";
import { getBookDetail, searchBooks } from "../lib/hardcover.js";
import { publicProcedure, router } from "../lib/trpc.js";

const DETAILS_BY_KEYS_BATCH_SIZE = 50;
const DETAILS_BY_KEYS_MAX_KEYS = 500;

type ResolveDetail<TDetail> = (key: string) => Promise<TDetail>;

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
      return getBookDetail(input.key, { allowRemoteFetch: false });
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
  DETAILS_BY_KEYS_BATCH_SIZE,
  DETAILS_BY_KEYS_MAX_KEYS,
};
