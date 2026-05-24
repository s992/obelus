import { randomUUID } from 'node:crypto';
import type { RecordSchema } from '@obelus/shared/schema';
import { describe, expect, it } from 'vitest';
import type z from 'zod';

import type { GetBooksByIdsQuery } from '../../gql/graphql';
import { collateRecordsAndBooks, formatBook } from '../collateRecordsAndBooks';

type Record = z.infer<typeof RecordSchema>;
type GqlBook = GetBooksByIdsQuery['books'][number];

const now = new Date('2025-06-01T12:00:00Z');
const yesterday = new Date('2025-05-31T12:00:00Z');

function makeRecord(overrides: Partial<Record> = {}) {
  return {
    id: randomUUID(),
    bookId: 1,
    startedAt: yesterday,
    finishedAt: now,
    judgment: 'accepted' as const,
    status: 'finished' as const,
    createdAt: yesterday,
    updatedAt: now,
    ...overrides,
  } satisfies Record;
}

function makeGqlBook(overrides: Partial<GqlBook> = {}) {
  return {
    id: 1,
    title: 'Dune',
    subtitle: 'A Novel',
    description: 'A science fiction masterpiece.',
    release_date: '1965-08-01',
    pages: 412,
    image: { url: 'https://example.com/dune.jpg', width: 300, height: 450 },
    featured_book_series: {
      position: 1,
      series: { id: 100, name: 'Dune Saga', books_count: 6 },
    },
    contributions: [{ contribution: 'Author', author: { name: 'Frank Herbert' } }],
    ...overrides,
  } satisfies GqlBook;
}

describe('formatBook', () => {
  it('maps a GQL book with a record to the Book shape', () => {
    const record = makeRecord();
    const gqlBook = makeGqlBook();

    const result = formatBook(gqlBook, record);

    expect(result).toEqual({
      id: 1,
      title: 'Dune',
      author: 'Frank Herbert',
      coverImage: 'https://example.com/dune.jpg',
      description: 'A science fiction masterpiece.',
      pages: 412,
      releaseDate: '1965-08-01',
      series: {
        bookCount: 6,
        id: 100,
        name: 'Dune Saga',
        position: 1,
      },
      subTitle: 'A Novel',
      record: {
        id: record.id,
        bookId: 1,
        startedAt: yesterday.toISOString(),
        finishedAt: now.toISOString(),
        judgment: 'accepted',
        status: 'finished',
        createdAt: yesterday.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
  });

  it('returns null fields when GQL book has missing optional data', () => {
    const gqlBook = makeGqlBook({
      title: null,
      subtitle: null,
      description: null,
      pages: null,
      image: null,
      featured_book_series: null,
      contributions: [],
    });

    const result = formatBook(gqlBook);

    expect(result.title).toBeNull();
    expect(result.subTitle).toBeNull();
    expect(result.description).toBeNull();
    expect(result.pages).toBeNull();
    expect(result.coverImage).toBeNull();
    expect(result.series).toBeNull();
    expect(result.author).toBeNull();
    expect(result.record).toBeNull();
  });

  it('picks the Author contribution, ignoring other contribution types', () => {
    const gqlBook = makeGqlBook({
      contributions: [
        { contribution: 'Editor', author: { name: 'Jane Editor' } },
        { contribution: 'Author', author: { name: 'Real Author' } },
        { contribution: 'Illustrator', author: { name: 'Art Person' } },
      ],
    });

    const result = formatBook(gqlBook);

    expect(result.author).toBe('Real Author');
  });

  it('treats a null contribution field as Author', () => {
    const gqlBook = makeGqlBook({
      contributions: [{ contribution: null, author: { name: 'Sole Contributor' } }],
    });

    const result = formatBook(gqlBook);

    expect(result.author).toBe('Sole Contributor');
  });

  it('serialises nullable date fields on the record', () => {
    const record = makeRecord({ startedAt: null, finishedAt: null });

    const result = formatBook(makeGqlBook(), record);

    expect(result.record?.startedAt).toBeNull();
    expect(result.record?.finishedAt).toBeNull();
  });
});

describe('collateRecordsAndBooks', () => {
  it('attaches the correct record to each matching book', () => {
    const recordA = makeRecord({ bookId: 1, status: 'finished', judgment: 'accepted' });
    const recordB = makeRecord({ bookId: 2, status: 'reading', judgment: null });

    const books = [makeGqlBook({ id: 1, title: 'Dune' }), makeGqlBook({ id: 2, title: 'Neuromancer' })];

    const result = collateRecordsAndBooks([recordA, recordB], books);

    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe('Dune');
    expect(result[0]?.record?.id).toBe(recordA.id);
    expect(result[0]?.record?.status).toBe('finished');
    expect(result[0]?.record?.judgment).toBe('accepted');

    expect(result[1]?.title).toBe('Neuromancer');
    expect(result[1]?.record?.id).toBe(recordB.id);
    expect(result[1]?.record?.status).toBe('reading');
    expect(result[1]?.record?.judgment).toBeNull();
  });

  it('filters out records whose book is not in the GQL response', () => {
    const records = [makeRecord({ bookId: 1 }), makeRecord({ bookId: 999 })];

    const books = [makeGqlBook({ id: 1 })];

    const result = collateRecordsAndBooks(records, books);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it('returns an empty array when no records match any books', () => {
    const records = [makeRecord({ bookId: 999 })];
    const books = [makeGqlBook({ id: 1 })];

    const result = collateRecordsAndBooks(records, books);

    expect(result).toEqual([]);
  });

  it('returns an empty array when given empty inputs', () => {
    expect(collateRecordsAndBooks([], [])).toEqual([]);
  });
});
