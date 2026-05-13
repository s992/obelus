import { book } from '@obelus/shared/schema';
import type { Book } from '@obelus/shared/types';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import z from 'zod';

import { db } from '../db/db';
import { recordTable } from '../db/schema';
import { client } from '../gql/client';
import type { GetBooksByIdsQuery } from '../gql/graphql';
import { privateProcedure, router } from '../trpc/trpc';

export const bookRouter = router({
  search: privateProcedure
    .input(z.object({ query: z.string().nonempty() }))
    .output(z.array(book))
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
    .output(book)
    .query(async ({ input, ctx }) => {
      const { books } = await client.GetBooksByIds({ ids: [input.id] });
      const book = books[0];

      if (!book) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [record] = await db
        .select()
        .from(recordTable)
        .where(and(eq(recordTable.userId, ctx.currentUser.id!), eq(recordTable.bookId, input.id)));

      return formatBook(book, record);
    }),
  seriesById: privateProcedure
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        books: z.array(book),
        series: z.object({ id: z.number().nullable(), bookCount: z.number().nullable(), name: z.string().nullable() }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { book_series: bookSeries } = await client.GetSeriesById({ id: input.id });

      if (!bookSeries.length) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const ids = bookSeries.map(({ book }) => book?.id).filter((id) => id !== undefined);
      const records = await db
        .select()
        .from(recordTable)
        .where(and(eq(recordTable.userId, ctx.currentUser.id!), inArray(recordTable.bookId, ids)));

      const books = bookSeries
        .map(({ book }) => {
          if (!book) {
            return null;
          }

          const record = records.find(({ bookId }) => bookId === book.id);

          return formatBook(book, record);
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

function formatBook(book: GetBooksByIdsQuery['books'][number], record?: typeof recordTable.$inferSelect): Book {
  const author = book.contributions.find(({ contribution }) => contribution === null || contribution === 'Author');

  return {
    id: book.id,
    title: book.title ?? null,
    author: author?.author?.name ?? null,
    coverImage: book.image?.url ?? null,
    description: book.description ?? null,
    pages: book.pages ?? null,
    releaseDate: book.release_date as string,
    series: book.featured_book_series
      ? {
          bookCount: book.featured_book_series.series?.books_count ?? null,
          id: book.featured_book_series.series?.id ?? null,
          name: book.featured_book_series.series?.name ?? null,
          position: book.featured_book_series.position as number,
        }
      : null,
    subTitle: book.subtitle ?? null,
    record: record ?? null,
  };
}
