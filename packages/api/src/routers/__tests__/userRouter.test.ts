import { initTRPC, TRPCError } from '@trpc/server';
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
import type { Context } from '../../trpc/context';
import { userRouter } from '../userRouter';

const mockedHashPassword = vi.mocked(hashPassword);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedGetUserById = vi.mocked(getUserById);
const mockedUpdateUser = vi.mocked(updateUser);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(userRouter);

const now = new Date('2025-06-01T12:00:00Z');

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

function makeUser(id: string) {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    userName: 'alice',
    passwordHash: 'hashed-old-password',
    public: false,
  };
}

describe('userRouter', () => {
  describe('me', () => {
    it('returns the current user profile', async () => {
      const userId = randomUUID();
      const caller = authedCaller(userId);
      mockedGetUserById.mockResolvedValue(makeUser(userId));

      const result = await caller.me();

      expect(result).toEqual({ id: userId, userName: 'alice', public: false });
    });

    it('returns null when user is not found in DB', async () => {
      const caller = authedCaller();
      mockedGetUserById.mockResolvedValue(null);

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
        userid: userId,
      });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = unauthenticatedCaller();

      await expect(caller.update({ public: true })).rejects.toThrow(TRPCError);
    });
  });
});
