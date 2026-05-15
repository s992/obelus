import { BookSchema, RecordSchema } from '@obelus/shared/schema';
import { TRPCError } from '@trpc/server';
import z from 'zod';

import { formatBook } from '../bookRecord/collateRecordsAndBooks';
import { db } from '../db/db';
import { client } from '../gql/client';
import { getRecordByBookId, listRecordsByBookIds } from '../sqlc/record_sql';
import { privateProcedure, router } from '../trpc/trpc';

export const bookRouter = router({
  search: privateProcedure
    .input(z.object({ query: z.string().nonempty() }))
    .output(z.array(BookSchema))
    .query(async ({ input }) => {
      const searchResult = await client.SearchBooks({ query: input.query });
      const ids = (searchResult.search?.ids ?? []).filter((id) => id !== null);

      if (!ids) {
        return [];
      }

      const { books } = await client.GetBooksByIds({ ids });

      return books.map((book) => formatBook(book));
    }),
  byId: privateProcedure
    .input(z.object({ id: z.number() }))
    .output(BookSchema.nullable())
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return null;
      }

      const { books } = await client.GetBooksByIds({ ids: [input.id] });
      const book = books[0];

      if (!book) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const record = await getRecordByBookId(db, { bookid: input.id, userid: ctx.currentUser.id });

      return formatBook(book, RecordSchema.parse(record));
    }),
  seriesById: privateProcedure
    .input(z.object({ id: z.number() }))
    .output(
      z
        .object({
          books: z.array(BookSchema),
          series: z.object({
            id: z.number().nullable(),
            bookCount: z.number().nullable(),
            name: z.string().nullable(),
          }),
        })
        .nullable(),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return null;
      }

      const { book_series: bookSeries } = await client.GetSeriesById({ id: input.id });

      if (!bookSeries.length) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const ids = bookSeries.map(({ book }) => book?.id).filter((id) => id !== undefined);
      const records = await listRecordsByBookIds(db, {
        bookids: ids,
        userid: ctx.currentUser.id,
      });

      const books = bookSeries
        .map(({ book }) => {
          if (!book) {
            return null;
          }

          const record = records.find(({ bookId }) => bookId === book.id);
          const parsedRecord = RecordSchema.safeParse(record);

          return formatBook(book, parsedRecord.success ? parsedRecord.data : undefined);
        })
        .filter((book) => book !== null);

      const series = bookSeries[0]?.series;

      const seriesData = {
        id: series?.id ?? null,
        bookCount: series?.books_count ?? null,
        name: series?.name ?? null,
      };

      return {
        books,
        series: seriesData,
      };
    }),
});
