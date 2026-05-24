import { initTRPC, TRPCError } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/record_sql', () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

vi.mock('../../bookRecord/listUserRecords', () => ({
  listUserRecords: vi.fn(),
}));

import { listUserRecords } from '../../bookRecord/listUserRecords';
import { createRecord, deleteRecord, updateRecord } from '../../sqlc/record_sql';
import type { Context } from '../../trpc/context';
import { recordRouter } from '../recordRouter';

const mockedCreateRecord = vi.mocked(createRecord);
const mockedUpdateRecord = vi.mocked(updateRecord);
const mockedDeleteRecord = vi.mocked(deleteRecord);
const mockedListUserRecords = vi.mocked(listUserRecords);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(recordRouter);

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

describe('recordRouter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2025-06-01T12:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.create({ bookId: 1, status: 'planned' })).rejects.toThrow(TRPCError);
    });

    it('sets startedAt and finishedAt when status is finished', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      mockedCreateRecord.mockResolvedValue();

      await caller.create({ bookId: 42, status: 'finished' });

      const args = mockedCreateRecord.mock.calls[0]?.[1];
      expect(args?.startedat).toEqual(new Date('2025-06-01T12:00:00Z'));
      expect(args?.finishedat).toEqual(new Date('2025-06-01T12:00:00Z'));
      expect(args?.bookid).toBe(42);
      expect(args?.status).toBe('finished');
      expect(args?.userid).toBe('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      expect(args?.judgment).toBeNull();
    });

    it('sets startedAt but not finishedAt when status is reading', async () => {
      const caller = authedCaller();
      mockedCreateRecord.mockResolvedValue();

      await caller.create({ bookId: 1, status: 'reading' });

      const args = mockedCreateRecord.mock.calls[0]?.[1];
      expect(args?.startedat).toEqual(new Date('2025-06-01T12:00:00Z'));
      expect(args?.finishedat).toBeNull();
    });

    it('sets neither startedAt nor finishedAt when status is planned', async () => {
      const caller = authedCaller();
      mockedCreateRecord.mockResolvedValue();

      await caller.create({ bookId: 1, status: 'planned' });

      const args = mockedCreateRecord.mock.calls[0]?.[1];
      expect(args?.startedat).toBeNull();
      expect(args?.finishedat).toBeNull();
    });

    it('rejects invalid status values', async () => {
      const caller = authedCaller();

      // @ts-expect-error intentionally passing invalid status
      await expect(caller.create({ bookId: 1, status: 'burned' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('converts ISO date strings to Date objects for the DB call', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      const recordId = randomUUID();
      mockedUpdateRecord.mockResolvedValue();

      await caller.update({
        id: recordId,
        status: 'finished',
        judgment: 'accepted',
        startedAt: '2025-01-15T00:00:00Z',
        finishedAt: '2025-06-01T00:00:00Z',
      });

      const args = mockedUpdateRecord.mock.calls[0]?.[1];
      expect(args?.startedat).toEqual(new Date('2025-01-15T00:00:00Z'));
      expect(args?.finishedat).toEqual(new Date('2025-06-01T00:00:00Z'));
      expect(args?.judgment).toBe('accepted');
      expect(args?.id).toBe(recordId);
      expect(args?.userid).toBe('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
    });

    it('passes null dates when startedAt/finishedAt are omitted', async () => {
      const caller = authedCaller();
      mockedUpdateRecord.mockResolvedValue();

      await caller.update({ id: randomUUID(), status: 'reading' });

      const args = mockedUpdateRecord.mock.calls[0]?.[1];
      expect(args?.startedat).toBeNull();
      expect(args?.finishedat).toBeNull();
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.update({ id: randomUUID(), status: 'reading' })).rejects.toThrow(TRPCError);
    });
  });

  describe('delete', () => {
    it('deletes scoped to the current user', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      const recordId = randomUUID();
      mockedDeleteRecord.mockResolvedValue();

      await caller.delete({ id: recordId });

      expect(mockedDeleteRecord).toHaveBeenCalledWith(expect.anything(), {
        id: recordId,
        userid: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.delete({ id: randomUUID() })).rejects.toThrow(TRPCError);
    });
  });

  describe('list', () => {
    it('passes input and userId through to listUserRecords', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      mockedListUserRecords.mockResolvedValue({
        books: [],
        hasNextPage: false,
        nextPageToken: null,
        totalCount: 0,
      });

      await caller.list({
        status: 'finished',
        judgment: 'accepted',
        sortField: 'finished_at',
        cursor: 'abc',
      });

      expect(mockedListUserRecords).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        'abc',
        'finished_at',
        'finished',
        'accepted',
      );
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.list({ status: 'reading', judgment: null, sortField: 'last_activity' })).rejects.toThrow(
        TRPCError,
      );
    });
  });
});
