import { Book } from '@obelus/shared/types';
import z from 'zod';

import { client } from '../gql/client';
import { GetBooksByIdsQuery } from '../gql/graphql';
import { privateProcedure, router } from '../trpc/trpc';

export const bookRouter = router({
  search: privateProcedure.input(z.object({ query: z.string().nonempty() })).query(async ({ input }) => {
    const searchResult = await client.SearchBooks({ query: input.query });
    const ids = (searchResult.search?.ids ?? []).filter((id) => id !== null);

    if (!ids) {
      return [];
    }

    const { books } = await client.GetBooksByIds({ ids });

    return books.map(formatBook);
  }),
  byId: privateProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const { books } = await client.GetBooksByIds({ ids: [input.id] });
    const book = books[0];

    if (!book) {
      return null;
    }

    return formatBook(book);
  }),
});

function formatBook(book: GetBooksByIdsQuery['books'][number]): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.contributions[0]?.author?.name,
    coverImage: book.image?.url,
    description: book.description,
    pages: book.pages,
    releaseDate: book.release_date as string,
    series: {
      bookCount: book.featured_book_series?.series?.books_count,
      id: book.featured_book_series?.series?.id,
      name: book.featured_book_series?.series?.name,
      position: book.featured_book_series?.position as number,
    },
    subTitle: book.subtitle,
  };
}
