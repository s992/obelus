import { describe, expect, it, vi } from 'vitest';

import { paginate } from '../paginate';

type TestRow = {
  id: number;
  name: string;
  totalCount: number;
};

function makeRow(overrides: Partial<TestRow> = {}) {
  return {
    id: 1,
    name: 'row-1',
    totalCount: 10,
    ...overrides,
  } satisfies TestRow;
}

function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) => makeRow({ id: i + 1, name: `row-${i + 1}` }));
}

const defaults = {
  pageSize: 5,
  getNextCursor: (row: TestRow) => row.name,
  getCount: (row: TestRow) => row.totalCount,
};

describe('paginate', () => {
  it('returns empty results when queryFn returns no rows', async () => {
    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => [],
    });

    expect(result).toEqual({
      records: [],
      hasNextPage: false,
      nextPageToken: null,
      totalCount: 0,
      pageSize: 5,
    });
  });

  it('returns a partial page without hasNextPage', async () => {
    const rows = makeRows(3);

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => rows,
    });

    expect(result.records).toEqual(rows);
    expect(result.hasNextPage).toBe(false);
    expect(result.nextPageToken).toBeNull();
    expect(result.totalCount).toBe(10);
  });

  it('returns exactly pageSize results without hasNextPage', async () => {
    const rows = makeRows(5);

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => rows,
    });

    expect(result.records).toHaveLength(5);
    expect(result.hasNextPage).toBe(false);
    expect(result.nextPageToken).toBeNull();
  });

  it('pops the extra row and sets hasNextPage when queryFn returns pageSize + 1', async () => {
    const rows = makeRows(6);

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => [...rows],
    });

    expect(result.records).toHaveLength(5);
    expect(result.records.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.hasNextPage).toBe(true);
    expect(result.nextPageToken).not.toBeNull();
  });

  it('passes pageSize + 1 to queryFn', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);

    await paginate({
      ...defaults,
      currentCursor: null,
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith({ cursor: null, pageSize: 6 });
  });

  it('returns the original pageSize in the result', async () => {
    const result = await paginate({
      ...defaults,
      pageSize: 10,
      currentCursor: null,
      queryFn: async () => [],
    });

    expect(result.pageSize).toBe(10);
  });

  it('passes null cursor to queryFn when currentCursor is null', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);

    await paginate({
      ...defaults,
      currentCursor: null,
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ cursor: null }));
  });

  it('passes null cursor to queryFn when currentCursor is undefined', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);

    await paginate({
      ...defaults,
      currentCursor: undefined,
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ cursor: null }));
  });

  it('decodes a base64url cursor before passing to queryFn', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    const rawCursor = '2025-06-01T12:00:00.000Z';
    const encodedCursor = Buffer.from(rawCursor).toString('base64url');

    await paginate({
      ...defaults,
      currentCursor: encodedCursor,
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ cursor: rawCursor }));
  });

  it('produces a base64url-encoded nextPageToken from the last kept row', async () => {
    const rows = makeRows(6);

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => [...rows],
    });

    const decoded = Buffer.from(result.nextPageToken!, 'base64url').toString();
    expect(decoded).toBe('row-5');
  });

  it('round-trips a cursor through encode and decode', async () => {
    const originalValue = 'some-cursor-value-with-special/chars=';
    const rows = makeRows(6);

    const firstResult = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => [...rows],
      getNextCursor: () => originalValue,
    });

    const queryFn = vi.fn().mockResolvedValue([]);

    await paginate({
      ...defaults,
      currentCursor: firstResult.nextPageToken,
      queryFn,
    });

    expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ cursor: originalValue }));
  });

  it('sets nextPageToken to null when getNextCursor returns null on the last row', async () => {
    const rows = makeRows(6);

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => [...rows],
      getNextCursor: () => null,
    });

    expect(result.hasNextPage).toBe(true);
    expect(result.nextPageToken).toBeNull();
  });

  it('extracts totalCount from the last row via getCount', async () => {
    const rows = [makeRow({ totalCount: 42 }), makeRow({ totalCount: 99 })];

    const result = await paginate({
      ...defaults,
      currentCursor: null,
      queryFn: async () => rows,
    });

    expect(result.totalCount).toBe(99);
  });
});
