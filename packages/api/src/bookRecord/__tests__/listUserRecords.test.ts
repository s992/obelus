import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import type { ListRecordsRow } from '../../sqlc/record_sql';

vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/record_sql', () => ({
  listRecords: vi.fn(),
}));

vi.mock('../../gql/client', () => ({
  client: { GetBooksByIds: vi.fn() },
}));

import { client } from '../../gql/client';
import { listRecords } from '../../sqlc/record_sql';
import { listUserRecords } from '../listUserRecords';

const mockedListRecords = vi.mocked(listRecords);
const mockedGetBooksByIds = vi.mocked(client.GetBooksByIds);

const now = new Date('2025-06-01T12:00:00.000Z');
const earlier = new Date('2025-05-15T08:00:00.000Z');

function makeRow(overrides: Partial<ListRecordsRow> = {}) {
  return {
    id: randomUUID(),
    bookId: 1,
    finishedAt: now,
    startedAt: earlier,
    updatedAt: now,
    judgment: 'accepted',
    status: 'finished',
    createdAt: earlier,
    totalCount: '5',
    ...overrides,
  } satisfies ListRecordsRow;
}

function makeGqlBook(id: number) {
  return {
    id,
    title: `Book ${id}`,
    subtitle: null,
    description: null,
    release_date: null,
    pages: null,
    image: null,
    featured_book_series: null,
    contributions: [{ contribution: 'Author' as const, author: { name: 'Author' } }],
  };
}

describe('listUserRecords', () => {
  it('returns collated books with pagination metadata', async () => {
    const rows = [makeRow({ bookId: 1 }), makeRow({ bookId: 2 })];
    mockedListRecords.mockResolvedValue(rows);
    mockedGetBooksByIds.mockResolvedValue({ books: [makeGqlBook(1), makeGqlBook(2)] });

    const result = await listUserRecords('user-1', null, 'last_activity', 'finished', null);

    expect(result.books).toHaveLength(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.nextPageToken).toBeNull();
    expect(result.totalCount).toBe(5);
  });

  it('sets hasNextPage when more than PAGE_SIZE records return', async () => {
    const rows = Array.from({ length: 21 }, (_, i) =>
      makeRow({
        bookId: i + 1,
        updatedAt: new Date(now.getTime() - i * 1000),
      }),
    );
    mockedListRecords.mockResolvedValue(rows);
    mockedGetBooksByIds.mockResolvedValue({
      books: rows.slice(0, 20).map((r) => makeGqlBook(r.bookId)),
    });

    const result = await listUserRecords('user-1', null, 'last_activity', 'finished', null);

    expect(result.hasNextPage).toBe(true);
    expect(result.nextPageToken).toBeDefined();
    expect(result.books).toHaveLength(20);
  });

  it('produces a cursor that round-trips through decode', async () => {
    const rows = Array.from({ length: 21 }, (_, i) =>
      makeRow({
        bookId: i + 1,
        updatedAt: new Date(now.getTime() - i * 1000),
      }),
    );
    mockedListRecords.mockResolvedValue(rows);
    mockedGetBooksByIds.mockResolvedValue({
      books: rows.slice(0, 20).map((r) => makeGqlBook(r.bookId)),
    });

    const result = await listUserRecords('user-1', null, 'last_activity', 'finished', null);
    const cursor = result.nextPageToken!;

    const decoded = Buffer.from(cursor, 'base64url').toString();
    expect(new Date(decoded).toISOString()).toBe(rows[19]?.updatedAt?.toISOString());
  });

  it('uses finishedAt for cursor when sortField is finished_at', async () => {
    const finishedDate = new Date('2025-04-01T00:00:00.000Z');
    const rows = Array.from({ length: 21 }, (_, i) =>
      makeRow({
        bookId: i + 1,
        finishedAt: new Date(finishedDate.getTime() - i * 1000),
      }),
    );
    mockedListRecords.mockResolvedValue(rows);
    mockedGetBooksByIds.mockResolvedValue({
      books: rows.slice(0, 20).map((r) => makeGqlBook(r.bookId)),
    });

    const result = await listUserRecords('user-1', null, 'finished_at', 'finished', null);
    const decoded = Buffer.from(result.nextPageToken!, 'base64url').toString();

    expect(new Date(decoded).toISOString()).toBe(rows[19]?.finishedAt?.toISOString());
  });

  it('uses startedAt for cursor when sortField is started_at', async () => {
    const startedDate = new Date('2025-03-01T00:00:00.000Z');
    const rows = Array.from({ length: 21 }, (_, i) =>
      makeRow({
        bookId: i + 1,
        startedAt: new Date(startedDate.getTime() - i * 1000),
      }),
    );
    mockedListRecords.mockResolvedValue(rows);
    mockedGetBooksByIds.mockResolvedValue({
      books: rows.slice(0, 20).map((r) => makeGqlBook(r.bookId)),
    });

    const result = await listUserRecords('user-1', null, 'started_at', 'reading', null);
    const decoded = Buffer.from(result.nextPageToken!, 'base64url').toString();

    expect(new Date(decoded).toISOString()).toBe(rows[19]?.startedAt?.toISOString());
  });

  it('passes decoded cursor and params to listRecords', async () => {
    const cursorDate = new Date('2025-05-20T10:00:00.000Z');
    const encodedCursor = Buffer.from(cursorDate.toISOString()).toString('base64url');
    mockedListRecords.mockResolvedValue([]);
    mockedGetBooksByIds.mockResolvedValue({ books: [] });

    await listUserRecords('user-42', encodedCursor, 'started_at', 'reading', 'accepted');

    expect(mockedListRecords).toHaveBeenCalledWith(expect.anything(), {
      cursor: cursorDate,
      pagesize: 21,
      status: 'reading',
      judgment: 'accepted',
      userid: 'user-42',
      sortfield: 'started_at',
    });
  });

  it('returns totalCount 0 when no records exist', async () => {
    mockedListRecords.mockResolvedValue([]);
    mockedGetBooksByIds.mockResolvedValue({ books: [] });

    const result = await listUserRecords('user-1', null, 'last_activity', 'planned', null);

    expect(result.totalCount).toBe(0);
    expect(result.books).toEqual([]);
    expect(result.hasNextPage).toBe(false);
  });
});
