import { initTRPC } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/user_sql', () => ({
  getUserPublicProfile: vi.fn(),
}));

vi.mock('../../bookRecord/listUserRecords', () => ({
  listUserRecords: vi.fn(),
}));

import { listUserRecords } from '../../bookRecord/listUserRecords';
import { getUserPublicProfile } from '../../sqlc/user_sql';
import type { GetUserPublicProfileRow } from '../../sqlc/user_sql';
import type { Context } from '../../trpc/context';
import { publicRecordRouter } from '../publicRecordRouter';

const mockedGetUserPublicProfile = vi.mocked(getUserPublicProfile);
const mockedListUserRecords = vi.mocked(listUserRecords);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(publicRecordRouter);

const now = new Date('2025-06-01T12:00:00Z');

function caller(userId?: string) {
  return createCaller({
    req: {} as Context['req'],
    res: {} as Context['res'],
    currentUser: { isAuthenticated: !!userId, id: userId },
  });
}

function makeProfile(overrides: Partial<GetUserPublicProfileRow> = {}) {
  return {
    id: randomUUID(),
    userName: 'alice',
    public: true,
    totalRecords: '10',
    finishedThisYear: '3',
    readingCount: '2',
    finishedCount: '5',
    plannedCount: '3',
    oldestRecord: now,
    lastUpdated: now,
    ...overrides,
  } satisfies GetUserPublicProfileRow;
}

describe('publicRecordRouter', () => {
  describe('profile', () => {
    it('returns a public profile to an anonymous viewer', async () => {
      const profile = makeProfile({ public: true });
      mockedGetUserPublicProfile.mockResolvedValue(profile);

      const result = await caller().profile({ userName: 'alice' });

      expect(result).toEqual(profile);
    });

    it('returns a private profile to its owner', async () => {
      const userId = randomUUID();
      const profile = makeProfile({ id: userId, public: false });
      mockedGetUserPublicProfile.mockResolvedValue(profile);

      const result = await caller(userId).profile({ userName: 'alice' });

      expect(result).toEqual(profile);
    });

    it('throws NOT_FOUND when a non-owner views a private profile', async () => {
      const profile = makeProfile({ public: false });
      mockedGetUserPublicProfile.mockResolvedValue(profile);

      await expect(caller('different-user').profile({ userName: 'alice' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when user does not exist and viewer is anonymous', async () => {
      mockedGetUserPublicProfile.mockResolvedValue(null);

      await expect(caller().profile({ userName: 'nobody' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when user does not exist and viewer is authenticated', async () => {
      mockedGetUserPublicProfile.mockResolvedValue(null);

      await expect(caller('some-user').profile({ userName: 'nobody' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('records', () => {
    it('returns records for a public profile', async () => {
      const userId = randomUUID();
      const profile = makeProfile({ id: userId, public: true });
      mockedGetUserPublicProfile.mockResolvedValue(profile);
      mockedListUserRecords.mockResolvedValue({
        books: [],
        hasNextPage: false,
        nextPageToken: null,
        totalCount: 0,
      });

      await caller().records({
        userName: 'alice',
        status: 'finished',
        sortField: 'last_activity',
      });

      expect(mockedListUserRecords).toHaveBeenCalledWith(userId, undefined, 'last_activity', 'finished', null);
    });

    it('allows the owner to view records on a private profile', async () => {
      const userId = randomUUID();
      const profile = makeProfile({ id: userId, public: false });
      mockedGetUserPublicProfile.mockResolvedValue(profile);
      mockedListUserRecords.mockResolvedValue({
        books: [],
        hasNextPage: false,
        nextPageToken: null,
        totalCount: 0,
      });

      await caller(userId).records({
        userName: 'alice',
        status: 'reading',
        sortField: 'started_at',
      });

      expect(mockedListUserRecords).toHaveBeenCalled();
    });

    it('throws NOT_FOUND when a non-owner requests records on a private profile', async () => {
      const profile = makeProfile({ public: false });
      mockedGetUserPublicProfile.mockResolvedValue(profile);

      await expect(
        caller('other-user').records({
          userName: 'alice',
          status: 'finished',
          sortField: 'last_activity',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when user does not exist', async () => {
      mockedGetUserPublicProfile.mockResolvedValue(null);

      await expect(
        caller().records({
          userName: 'nobody',
          status: 'planned',
          sortField: 'last_activity',
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
