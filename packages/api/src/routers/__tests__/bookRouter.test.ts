import { initTRPC, TRPCError } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../gql/client', () => ({
  client: {
    SearchBooks: vi.fn(),
    GetBooksByIds: vi.fn(),
    GetSeriesById: vi.fn(),
  },
}));

vi.mock('../../sqlc/record_sql', () => ({
  getRecordByBookId: vi.fn(),
  listRecordsByBookIds: vi.fn(),
}));

import { client as gqlClient } from '../../gql/client';
import type { GetBooksByIdsQuery, GetSeriesByIdQuery } from '../../gql/graphql';
import { getRecordByBookId, listRecordsByBookIds } from '../../sqlc/record_sql';
import type { Context } from '../../trpc/context';
import { bookRouter } from '../bookRouter';

const mockedSearchBooks = vi.mocked(gqlClient.SearchBooks);
const mockedGetBooksByIds = vi.mocked(gqlClient.GetBooksByIds);
const mockedGetSeriesById = vi.mocked(gqlClient.GetSeriesById);
const mockedGetRecordByBookId = vi.mocked(getRecordByBookId);
const mockedListRecordsByBookIds = vi.mocked(listRecordsByBookIds);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(bookRouter);

function authedCaller(userId = randomUUID()) {
  return createCaller({
    req: {} as Context['req'],
    res: {} as Context['res'],
    currentUser: { isAuthenticated: true, id: userId },
  });
}

function unauthenticatedCaller() {
  return createCaller({
    req: {} as Context['req'],
    res: {} as Context['res'],
    currentUser: { isAuthenticated: false, id: undefined },
  });
}

type GqlBook = GetBooksByIdsQuery['books'][number];

function makeGqlBook(id: number, title = `Book ${id}`) {
  return {
    id,
    title,
    subtitle: null,
    description: null,
    release_date: '2025-01-01',
    pages: 200,
    image: { url: `https://example.com/${id}.jpg`, width: 300, height: 450 },
    featured_book_series: null,
    contributions: [{ contribution: 'Author' as const, author: { name: 'Test Author' } }],
  } satisfies GqlBook;
}

describe('bookRouter', () => {
  describe('search', () => {
    it('returns books matching the search query with attached records', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');

      mockedSearchBooks.mockResolvedValue({ search: { ids: [10, 20] } });
      mockedGetBooksByIds.mockResolvedValue({
        books: [makeGqlBook(10, 'Dune'), makeGqlBook(20, 'Neuromancer')],
      });
      mockedListRecordsByBookIds.mockResolvedValue([
        {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
          bookId: 10,
          finishedAt: null,
          judgment: null,
          startedAt: new Date(),
          status: 'reading',
        },
      ]);

      const result = await caller.search({ query: 'dune' });

      expect(result).toHaveLength(2);
      expect(result[0]?.title).toBe('Dune');
      expect(result[0]?.record?.status).toBe('reading');
      expect(result[1]?.title).toBe('Neuromancer');
      expect(result[1]?.record).toBeNull();
    });

    it('returns empty array when search returns no ids', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      mockedSearchBooks.mockResolvedValue({ search: { ids: [] } });
      mockedGetBooksByIds.mockResolvedValue({ books: [] });
      mockedListRecordsByBookIds.mockResolvedValue([]);

      const result = await caller.search({ query: 'nonexistent' });

      expect(result).toEqual([]);
    });

    it('filters out null ids from search results', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      mockedSearchBooks.mockResolvedValue({ search: { ids: [10, null, 20] } });
      mockedGetBooksByIds.mockResolvedValue({
        books: [makeGqlBook(10), makeGqlBook(20)],
      });
      mockedListRecordsByBookIds.mockResolvedValue([]);

      const result = await caller.search({ query: 'test' });

      expect(result).toHaveLength(2);
      expect(mockedGetBooksByIds).toHaveBeenCalledWith({ ids: [10, 20] });
    });

    it('rejects empty query string', async () => {
      const caller = authedCaller();

      await expect(caller.search({ query: '' })).rejects.toThrow();
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.search({ query: 'test' })).rejects.toThrow(TRPCError);
    });
  });

  describe('byId', () => {
    it('returns a book with its record', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      mockedGetBooksByIds.mockResolvedValue({ books: [makeGqlBook(42, 'Dune')] });
      mockedGetRecordByBookId.mockResolvedValue({
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        bookId: 42,
        finishedAt: new Date(),
        judgment: 'accepted',
        startedAt: new Date(),
        status: 'finished',
      });

      const result = await caller.byId({ id: 42 });

      expect(result?.title).toBe('Dune');
      expect(result?.record?.status).toBe('finished');
    });

    it('throws NOT_FOUND when the book does not exist', async () => {
      const caller = authedCaller();
      mockedGetBooksByIds.mockResolvedValue({ books: [] });

      await expect(caller.byId({ id: 999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.byId({ id: 1 })).rejects.toThrow(TRPCError);
    });
  });

  describe('seriesById', () => {
    it('returns series data with books', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      const seriesEntry = (id: number) =>
        ({
          position: id,
          series: { id: 100, name: 'Dune Saga', books_count: 6 },
          book: makeGqlBook(id),
        }) satisfies GetSeriesByIdQuery['book_series'][number];

      mockedGetSeriesById.mockResolvedValue({
        book_series: [seriesEntry(1), seriesEntry(2)],
      });
      mockedListRecordsByBookIds.mockResolvedValue([]);

      const result = await caller.seriesById({ id: 100 });

      expect(result?.series).toEqual({ id: 100, bookCount: 6, name: 'Dune Saga' });
      expect(result?.books).toHaveLength(2);
    });

    it('throws NOT_FOUND when series has no entries', async () => {
      const caller = authedCaller();
      mockedGetSeriesById.mockResolvedValue({ book_series: [] });

      await expect(caller.seriesById({ id: 999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.seriesById({ id: 1 })).rejects.toThrow(TRPCError);
    });
  });
});
