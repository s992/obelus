import { randomUUID } from 'node:crypto';
import { initTRPC, TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/note_sql', () => ({
  createNote: vi.fn(),
  listNotes: vi.fn(),
}));

vi.mock('../../sqlc/record_sql', () => ({
  getRecordById: vi.fn(),
}));

import { createNote, listNotes } from '../../sqlc/note_sql';
import { getRecordById } from '../../sqlc/record_sql';
import type { Context } from '../../trpc/context';
import { noteRouter } from '../noteRouter';

const mockedCreateNote = vi.mocked(createNote);
const mockedListNotes = vi.mocked(listNotes);
const mockedGetRecordById = vi.mocked(getRecordById);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(noteRouter);

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

describe('noteRouter', () => {
  describe('create', () => {
    it('creates a note when the record exists and belongs to the user', async () => {
      const userId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
      const recordId = randomUUID();
      const caller = authedCaller(userId);

      mockedGetRecordById.mockResolvedValue({
        id: recordId,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        bookId: 1,
        finishedAt: null,
        judgment: null,
        startedAt: null,
        status: 'reading',
      });
      mockedCreateNote.mockResolvedValue();

      await caller.create({ id: recordId, content: 'Great chapter on sandworms.' });

      expect(mockedCreateNote).toHaveBeenCalledWith(expect.anything(), {
        content: 'Great chapter on sandworms.',
        recordid: recordId,
        userid: userId,
      });
    });

    it('throws BAD_REQUEST when the record does not exist', async () => {
      const caller = authedCaller();
      mockedGetRecordById.mockResolvedValue(null);

      await expect(caller.create({ id: randomUUID(), content: 'Orphan note' })).rejects.toThrow(TRPCError);

      await expect(caller.create({ id: randomUUID(), content: 'Orphan note' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('scopes the record ownership check to the current user', async () => {
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
      const recordId = randomUUID();
      mockedGetRecordById.mockResolvedValue(null);

      try {
        await caller.create({ id: recordId, content: 'test' });
      } catch {}

      expect(mockedGetRecordById).toHaveBeenCalledWith(expect.anything(), {
        id: recordId,
        userid: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.create({ id: randomUUID(), content: 'sneaky' })).rejects.toThrow(TRPCError);
    });
  });

  describe('list', () => {
    it('returns notes with ISO date strings', async () => {
      const noteId = randomUUID();
      const recordId = randomUUID();
      const caller = authedCaller('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');

      mockedListNotes.mockResolvedValue([
        { id: noteId, content: 'A thought', createdAt: new Date('2025-03-15T10:00:00Z') },
      ]);

      const result = await caller.list({ id: recordId });

      expect(result).toEqual([{ id: noteId, content: 'A thought', createdAt: '2025-03-15T10:00:00.000Z' }]);
    });

    it('returns null for unauthenticated users', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.list({ id: randomUUID() })).rejects.toThrow(TRPCError);
    });
  });
});
