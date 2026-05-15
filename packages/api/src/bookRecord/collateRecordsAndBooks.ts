import type { RecordSchema } from '@obelus/shared/schema';
import type { Book, Maybe } from '@obelus/shared/types';
import type z from 'zod';

import type { GetBooksByIdsQuery } from '../gql/graphql';

type Record = z.infer<typeof RecordSchema>;

export function collateRecordsAndBooks(records: Record[], books: GetBooksByIdsQuery['books']) {
  return records
    .map((record) => {
      const book = books.find((book) => book.id === record.bookId);

      if (!book) {
        return null;
      }

      return formatBook(book, record);
    })
    .filter((book) => book !== null);
}

export function formatBook(book: GetBooksByIdsQuery['books'][number], record?: Maybe<Record>): Book {
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
    record: record
      ? {
          ...record,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
          startedAt: record.startedAt?.toISOString() ?? null,
          finishedAt: record.finishedAt?.toISOString() ?? null,
        }
      : null,
  };
}
