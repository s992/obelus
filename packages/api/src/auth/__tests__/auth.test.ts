import { TRPCError } from '@trpc/server';
import { DatabaseError } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../db/tx', () => ({
  tx: vi.fn((fn: (client: unknown) => unknown) => fn({})),
}));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

vi.mock('../../sqlc/user_sql', () => ({
  createUser: vi.fn(),
  getUserByUserName: vi.fn(),
  hasUsers: vi.fn(),
}));

vi.mock('../../sqlc/invite_link_sql', () => ({
  useInviteLink: vi.fn(),
}));

import { useInviteLink } from '../../sqlc/invite_link_sql';
import type { GetInviteLinkRow } from '../../sqlc/invite_link_sql';
import { createUser, getUserByUserName, hasUsers } from '../../sqlc/user_sql';
import { hashPassword, login, register, verifyPassword } from '../auth';

const mockedCreateUser = vi.mocked(createUser);
const mockedGetUserByUserName = vi.mocked(getUserByUserName);
const mockedHasUsers = vi.mocked(hasUsers);
const mockedUseInviteLink = vi.mocked(useInviteLink);

function makeInviteLink(overrides?: Partial<GetInviteLinkRow>): GetInviteLinkRow {
  return {
    id: 'link-1',
    createdAt: new Date('2025-01-01'),
    createdBy: 'admin-id',
    token: 'valid-token',
    expiresAt: new Date(Date.now() + 86400000),
    usedAt: null,
    usedBy: null,
    ...overrides,
  };
}

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
  beforeEach(() => {
    mockedHasUsers.mockResolvedValue({ usersExist: 'true' });
  });

  it('returns the new user on success', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-123', status: 'active' });

    const user = await register('alice', 'password123', 'active', null);

    expect(user).toEqual({ id: 'user-123', status: 'active' });
    expect(mockedCreateUser).toHaveBeenCalledOnce();
    const args = mockedCreateUser.mock.calls[0]?.[1];
    expect(args?.username).toBe('alice');
    expect(args?.passwordhash).toBeDefined();
    expect(args?.passwordhash).not.toBe('password123');
    expect(args?.registrationstatus).toBe('active');
    expect(args?.role).toBe('member');
  });

  it('assigns admin role to the first registered user', async () => {
    mockedHasUsers.mockResolvedValue(null);
    mockedCreateUser.mockResolvedValue({ id: 'user-1', status: 'active' });

    await register('alice', 'password123', 'active', null);

    expect(mockedCreateUser).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'admin' }));
  });

  it('assigns member role to subsequent users', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-2', status: 'active' });

    await register('bob', 'password123', 'active', null);

    expect(mockedCreateUser).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'member' }));
  });

  it('passes registration status through to createUser', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-3', status: 'pending_approval' });

    await register('carol', 'password123', 'pending_approval', null);

    expect(mockedCreateUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ registrationstatus: 'pending_approval' }),
    );
  });

  it('calls useInviteLink when an invite link is provided', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-123', status: 'active' });
    const inviteLink = makeInviteLink();

    await register('alice', 'password123', 'active', inviteLink);

    expect(mockedUseInviteLink).toHaveBeenCalledWith(expect.anything(), {
      token: 'valid-token',
      userid: 'user-123',
    });
  });

  it('does not call useInviteLink when invite link is null', async () => {
    mockedCreateUser.mockResolvedValue({ id: 'user-123', status: 'active' });

    await register('alice', 'password123', 'active', null);

    expect(mockedUseInviteLink).not.toHaveBeenCalled();
  });

  it('throws CONFLICT when username already exists (pg unique violation)', async () => {
    const dbErr = new DatabaseError('duplicate key value violates unique constraint', 0, 'error');
    dbErr.code = '23505';
    mockedCreateUser.mockRejectedValue(dbErr);

    await expect(register('alice', 'password123', 'active', null)).rejects.toThrow(TRPCError);
    await expect(register('alice', 'password123', 'active', null)).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('re-throws non-duplicate DatabaseErrors', async () => {
    const dbErr = new DatabaseError('connection refused', 0, 'error');
    dbErr.code = '08001';
    mockedCreateUser.mockRejectedValue(dbErr);

    await expect(register('alice', 'password123', 'active', null)).rejects.toThrow(DatabaseError);
  });

  it('re-throws non-DatabaseError exceptions', async () => {
    mockedCreateUser.mockRejectedValue(new TypeError('unexpected'));

    await expect(register('alice', 'password123', 'active', null)).rejects.toThrow(TypeError);
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
      status: 'active',
      role: 'member',
    };
    mockedGetUserByUserName.mockResolvedValue(user);

    const result = await login('bob', 'correct-password');

    expect(result).toBe(user);
  });

  it('throws UNAUTHORIZED when user status is not active', async () => {
    const hash = await hashPassword('correct-password');
    mockedGetUserByUserName.mockResolvedValue({
      id: 'user-456',
      createdAt: new Date(),
      updatedAt: new Date(),
      userName: 'bob',
      passwordHash: hash,
      public: false,
      status: 'pending_approval',
      role: 'member',
    });

    await expect(login('bob', 'correct-password')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
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
      status: 'active',
      role: 'member',
    });

    await expect(login('bob', 'wrong-password')).rejects.toThrow(TRPCError);
    await expect(login('bob', 'wrong-password')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
