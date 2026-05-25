import { TRPCError } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../auth/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('../../sqlc/user_sql', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

import { hashPassword, verifyPassword } from '../../auth/auth';
import { getUserById, updateUser } from '../../sqlc/user_sql';
import { userRouter } from '../userRouter';
import { createCallerFactory, makeCallerHelpers } from './routerTestHelpers';

const mockedHashPassword = vi.mocked(hashPassword);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedGetUserById = vi.mocked(getUserById);
const mockedUpdateUser = vi.mocked(updateUser);

const createCaller = createCallerFactory(userRouter);
const { authedCaller, unauthenticatedCaller } = makeCallerHelpers(createCaller);

const now = new Date('2025-06-01T12:00:00Z');

function makeUser(id: string, overrides?: { status?: string; role?: string }) {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    userName: 'alice',
    passwordHash: 'hashed-old-password',
    public: false,
    status: 'active',
    role: 'member',
    ...overrides,
  };
}

describe('userRouter', () => {
  describe('me', () => {
    it('returns the current user profile', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedGetUserById.mockResolvedValue(makeUser(userId));

      const result = await caller.me();

      expect(result).toEqual({ id: userId, userName: 'alice', public: false, role: 'member' });
    });

    it('returns null when user is not found in DB', async () => {
      const caller = authedCaller();
      mockedGetUserById.mockResolvedValue(null);

      expect(await caller.me()).toBeNull();
    });

    it('returns null when user status is pending_approval', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedGetUserById.mockResolvedValue(makeUser(userId, { status: 'pending_approval' }));

      expect(await caller.me()).toBeNull();
    });

    it('returns null when user status is disabled', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedGetUserById.mockResolvedValue(makeUser(userId, { status: 'disabled' }));

      expect(await caller.me()).toBeNull();
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.me()).rejects.toThrow(TRPCError);
    });
  });

  describe('changePassword', () => {
    it('hashes the new password and updates the user', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedGetUserById.mockResolvedValue(makeUser(userId));
      mockedVerifyPassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('hashed-new-password');
      mockedUpdateUser.mockResolvedValue();

      await caller.changePassword({
        currentPassword: 'old-password',
        newPassword: 'new-secure-password',
      });

      expect(mockedVerifyPassword).toHaveBeenCalledWith('hashed-old-password', 'old-password');
      expect(mockedHashPassword).toHaveBeenCalledWith('new-secure-password');
      expect(mockedUpdateUser).toHaveBeenCalledWith(expect.anything(), {
        passwordhash: 'hashed-new-password',
        public: null,
        status: null,
        userid: userId,
      });
    });

    it('throws UNAUTHORIZED when current password is wrong', async () => {
      const caller = authedCaller();
      mockedGetUserById.mockResolvedValue(makeUser(randomUUID()));
      mockedVerifyPassword.mockResolvedValue(false);

      await expect(
        caller.changePassword({ currentPassword: 'wrong', newPassword: 'new-secure-password' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

      expect(mockedUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when user does not exist', async () => {
      const caller = authedCaller();
      mockedGetUserById.mockResolvedValue(null);

      await expect(
        caller.changePassword({ currentPassword: 'any', newPassword: 'new-secure-password' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rejects new passwords shorter than 8 characters', async () => {
      const caller = authedCaller();

      await expect(caller.changePassword({ currentPassword: 'old', newPassword: 'short' })).rejects.toThrow();

      expect(mockedGetUserById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates the public flag', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedUpdateUser.mockResolvedValue();

      await caller.update({ public: true });

      expect(mockedUpdateUser).toHaveBeenCalledWith(expect.anything(), {
        public: true,
        passwordhash: null,
        status: null,
        userid: userId,
      });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.update({ public: true })).rejects.toThrow(TRPCError);
    });
  });
});
