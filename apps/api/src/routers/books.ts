import { z } from "zod";
import { coverImageUrl, getBookDetail, searchBooks } from "../lib/openlibrary.js";
import { publicProcedure, router } from "../lib/trpc.js";

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
        keys: z.array(z.string().min(1)).max(50),
      }),
    )
    .query(async ({ input }) => {
      const uniqueKeys = [...new Set(input.keys)];
      const entries = await Promise.allSettled(
        uniqueKeys.map(async (key) => {
          const detail = await getBookDetail(key, { allowRemoteFetch: false });
          return [key, detail] as const;
        }),
      );

      return Object.fromEntries(
        entries
          .flatMap((entry) => (entry.status === "fulfilled" ? [entry.value] : []))
          .map(([key, detail]) => [key, detail]),
      );
    }),

  coverUrl: publicProcedure
    .input(
      z.object({
        coverId: z.number(),
        size: z.enum(["S", "M", "L"]).optional(),
      }),
    )
    .query(({ input }) => coverImageUrl(input.coverId, input.size ?? "M")),
});
