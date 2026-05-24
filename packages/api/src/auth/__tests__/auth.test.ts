import { TRPCError } from '@trpc/server';
import { DatabaseError } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { hashPassword, login, register, verifyPassword } from '../auth';

vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/user_sql', () => ({
  createUser: vi.fn(),
  getUserByUserName: vi.fn(),
}));

import { createUser, getUserByUserName } from '../../sqlc/user_sql';

const mockedCreateUser = vi.mocked(createUser);
const mockedGetUserByUserName = vi.mocked(getUserByUserName);

describe('hashPassword / verifyPassword', () => {
  it('produces a hash that verifyPassword accepts', async () => {
    const hash = await hashPassword('my-secret-password');

    expect(hash).not.toBe('my-secret-password');
    expect(await verifyPassword(hash, 'my-secret-password')).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-password');

    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('returns false instead of throwing on a malformed hash', async () => {
    expect(await verifyPassword('not-a-real-hash', 'password')).toBe(false);
  });
});

describe('register', () => {
  it('returns the new user id on success', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-123' });

    const id = await register('alice', 'password123');

    expect(id).toBe('user-123');
    expect(mockedCreateUser).toHaveBeenCalledOnce();
    const args = mockedCreateUser.mock.calls[0]?.[1];
    expect(args?.username).toBe('alice');
    expect(args?.passwordhash).toBeDefined();
    expect(args?.passwordhash).not.toBe('password123');
  });

  it('throws CONFLICT when username already exists (pg unique violation)', async () => {
    const dbErr = new DatabaseError('duplicate key value violates unique constraint', 0, 'error');
    dbErr.code = '23505';
    mockedCreateUser.mockRejectedValue(dbErr);

    await expect(register('alice', 'password123')).rejects.toThrow(TRPCError);
    await expect(register('alice', 'password123')).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('re-throws non-duplicate DatabaseErrors', async () => {
    const dbErr = new DatabaseError('connection refused', 0, 'error');
    dbErr.code = '08001';
    mockedCreateUser.mockRejectedValue(dbErr);

    await expect(register('alice', 'password123')).rejects.toThrow(DatabaseError);
  });

  it('re-throws non-DatabaseError exceptions', async () => {
    mockedCreateUser.mockRejectedValue(new TypeError('unexpected'));

    await expect(register('alice', 'password123')).rejects.toThrow(TypeError);
  });
});

describe('login', () => {
  it('returns the user when credentials are valid', async () => {
    const hash = await hashPassword('correct-password');
    const user = {
      id: 'user-456',
      createdAt: new Date(),
      updatedAt: new Date(),
      userName: 'bob',
      passwordHash: hash,
      public: false,
    };
    mockedGetUserByUserName.mockResolvedValue(user);

    const result = await login('bob', 'correct-password');

    expect(result).toBe(user);
  });

  it('throws UNAUTHORIZED when user does not exist', async () => {
    mockedGetUserByUserName.mockResolvedValue(null);

    await expect(login('nobody', 'password')).rejects.toThrow(TRPCError);
    await expect(login('nobody', 'password')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws UNAUTHORIZED when password is wrong', async () => {
    const hash = await hashPassword('correct-password');
    mockedGetUserByUserName.mockResolvedValue({
      id: 'user-789',
      createdAt: new Date(),
      updatedAt: new Date(),
      userName: 'bob',
      passwordHash: hash,
      public: false,
    });

    await expect(login('bob', 'wrong-password')).rejects.toThrow(TRPCError);
    await expect(login('bob', 'wrong-password')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
