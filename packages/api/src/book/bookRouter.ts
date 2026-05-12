import { book } from '@obelus/shared/schema';
import type { Book } from '@obelus/shared/types';
import { TRPCError } from '@trpc/server';
import z from 'zod';

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

      return books.map(formatBook);
    }),
  byId: privateProcedure
    .input(z.object({ id: z.number() }))
    .output(book)
    .query(async ({ input }) => {
      const { books } = await client.GetBooksByIds({ ids: [input.id] });
      const book = books[0];

      if (!book) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return formatBook(book);
    }),
});

function formatBook(book: GetBooksByIdsQuery['books'][number]): Book {
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
  };
}
