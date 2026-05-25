import { initTRPC, TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookie = vi.fn();
const mockClearCookie = vi.fn();
const mockJwtSign = vi.fn();

vi.mock('../../server', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));
vi.mock('../../config', () => ({
  config: { OBELUS_BASE_URL: 'https://obelus.example.com' },
}));

vi.mock('../../auth/auth', () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../../sqlc/config_sql', () => ({
  getConfig: vi.fn(),
}));

vi.mock('../../sqlc/invite_link_sql', () => ({
  getInviteLink: vi.fn(),
}));

import { login, register } from '../../auth/auth';
import { checkRateLimit } from '../../server';
import { getConfig } from '../../sqlc/config_sql';
import { getInviteLink } from '../../sqlc/invite_link_sql';
import type { GetInviteLinkRow } from '../../sqlc/invite_link_sql';
import type { Context } from '../../trpc/context';
import { authRouter } from '../authRouter';

const mockedRegister = vi.mocked(register);
const mockedLogin = vi.mocked(login);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);
const mockedGetConfig = vi.mocked(getConfig);
const mockedGetInviteLink = vi.mocked(getInviteLink);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(authRouter);

function makeCaller() {
  return createCaller({
    req: { server: { jwt: { sign: mockJwtSign } } } as unknown as Context['req'],
    res: { cookie: mockCookie, clearCookie: mockClearCookie } as unknown as Context['res'],
    currentUser: { isAuthenticated: false },
  });
}

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

describe('authRouter', () => {
  beforeEach(() => {
    mockedCheckRateLimit.mockResolvedValue({
      isAllowed: true,
      key: 'test',
    } as Awaited<ReturnType<typeof checkRateLimit>>);
    mockedGetConfig.mockResolvedValue({
      registrationStrategy: 'open',
    } as Awaited<ReturnType<typeof getConfig>>);
  });

  describe('register', () => {
    describe('open strategy', () => {
      it('registers user as active and sets cookie', async () => {
        const caller = makeCaller();
        mockedRegister.mockResolvedValue({ id: 'new-user-id', status: 'active' });
        mockJwtSign.mockReturnValue('jwt-token-value');

        const result = await caller.register({ userName: 'alice', password: 'securepassword' });

        expect(mockedRegister).toHaveBeenCalledWith('alice', 'securepassword', 'active', null);
        expect(mockJwtSign).toHaveBeenCalledWith({ id: 'new-user-id' }, expect.objectContaining({ expiresIn: '30d' }));
        expect(mockCookie).toHaveBeenCalledWith(
          'token',
          'jwt-token-value',
          expect.objectContaining({
            httpOnly: true,
            signed: true,
            secure: true,
            domain: 'obelus.example.com',
          }),
        );
        expect(result).toEqual({ id: 'new-user-id', status: 'active' });
      });
    });

    describe('closed strategy', () => {
      it('throws FORBIDDEN and does not call register', async () => {
        mockedGetConfig.mockResolvedValue({
          registrationStrategy: 'closed',
        } as Awaited<ReturnType<typeof getConfig>>);
        const caller = makeCaller();

        await expect(caller.register({ userName: 'alice', password: 'securepassword' })).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });

        expect(mockedRegister).not.toHaveBeenCalled();
      });
    });

    describe('invite_link strategy', () => {
      beforeEach(() => {
        mockedGetConfig.mockResolvedValue({
          registrationStrategy: 'invite_link',
        } as Awaited<ReturnType<typeof getConfig>>);
      });

      it('registers user with a valid invite token', async () => {
        const caller = makeCaller();
        const inviteLink = makeInviteLink();
        mockedGetInviteLink.mockResolvedValue(inviteLink);
        mockedRegister.mockResolvedValue({ id: 'new-id', status: 'active' });
        mockJwtSign.mockReturnValue('jwt-token');

        await caller.register({
          userName: 'alice',
          password: 'securepassword',
          inviteToken: 'valid-token',
        });

        expect(mockedGetInviteLink).toHaveBeenCalledWith(expect.anything(), { token: 'valid-token' });
        expect(mockedRegister).toHaveBeenCalledWith('alice', 'securepassword', 'active', inviteLink);
        expect(mockCookie).toHaveBeenCalled();
      });

      it('throws UNPROCESSABLE_CONTENT when inviteToken is missing', async () => {
        const caller = makeCaller();

        await expect(caller.register({ userName: 'alice', password: 'securepassword' })).rejects.toMatchObject({
          code: 'UNPROCESSABLE_CONTENT',
        });

        expect(mockedRegister).not.toHaveBeenCalled();
      });

      it('throws UNPROCESSABLE_CONTENT when invite link is not found', async () => {
        const caller = makeCaller();
        mockedGetInviteLink.mockResolvedValue(null);

        await expect(
          caller.register({ userName: 'alice', password: 'securepassword', inviteToken: 'bad-token' }),
        ).rejects.toMatchObject({ code: 'UNPROCESSABLE_CONTENT' });

        expect(mockedRegister).not.toHaveBeenCalled();
      });

      it('throws UNPROCESSABLE_CONTENT when invite link is already used', async () => {
        const caller = makeCaller();
        mockedGetInviteLink.mockResolvedValue(makeInviteLink({ usedAt: new Date('2025-06-01'), usedBy: 'someone' }));

        await expect(
          caller.register({ userName: 'alice', password: 'securepassword', inviteToken: 'used-token' }),
        ).rejects.toMatchObject({ code: 'UNPROCESSABLE_CONTENT' });

        expect(mockedRegister).not.toHaveBeenCalled();
      });

      it('throws UNPROCESSABLE_CONTENT when invite link is expired', async () => {
        const caller = makeCaller();
        mockedGetInviteLink.mockResolvedValue(makeInviteLink({ expiresAt: new Date('2020-01-01') }));

        await expect(
          caller.register({ userName: 'alice', password: 'securepassword', inviteToken: 'expired-token' }),
        ).rejects.toMatchObject({ code: 'UNPROCESSABLE_CONTENT' });

        expect(mockedRegister).not.toHaveBeenCalled();
      });
    });

    describe('requires_approval strategy', () => {
      it('registers user as pending_approval and does not set cookie', async () => {
        mockedGetConfig.mockResolvedValue({
          registrationStrategy: 'requires_approval',
        } as Awaited<ReturnType<typeof getConfig>>);
        const caller = makeCaller();
        mockedRegister.mockResolvedValue({ id: 'new-id', status: 'pending_approval' });

        const result = await caller.register({ userName: 'alice', password: 'securepassword' });

        expect(mockedRegister).toHaveBeenCalledWith('alice', 'securepassword', 'pending_approval', null);
        expect(mockJwtSign).not.toHaveBeenCalled();
        expect(mockCookie).not.toHaveBeenCalled();
        expect(result).toEqual({ id: 'new-id', status: 'pending_approval' });
      });
    });

    it('throws INTERNAL_SERVER_ERROR when register returns null', async () => {
      const caller = makeCaller();
      mockedRegister.mockResolvedValue(null);

      await expect(caller.register({ userName: 'alice', password: 'securepassword' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('rejects empty username', async () => {
      const caller = makeCaller();

      await expect(caller.register({ userName: '', password: 'securepassword' })).rejects.toThrow();

      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it('rejects password shorter than 8 characters', async () => {
      const caller = makeCaller();

      await expect(caller.register({ userName: 'alice', password: 'short' })).rejects.toThrow();

      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it('rejects when rate limited', async () => {
      mockedCheckRateLimit.mockResolvedValue({
        isAllowed: false,
        isExceeded: true,
        isBanned: false,
        key: 'test',
        max: 5,
        timeWindow: 60000,
        remaining: 0,
        ttl: 60000,
        ttlInSeconds: 60,
      });
      const caller = makeCaller();

      await expect(caller.register({ userName: 'alice', password: 'securepassword' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });
  });

  describe('login', () => {
    it('sets a signed cookie on successful login', async () => {
      const caller = makeCaller();
      const user = {
        id: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: 'bob',
        passwordHash: 'hashed',
        public: false,
        status: 'active',
        role: 'member',
      };
      mockedLogin.mockResolvedValue(user);
      mockJwtSign.mockReturnValue('login-jwt');

      await caller.login({ userName: 'bob', password: 'mypassword' });

      expect(mockedLogin).toHaveBeenCalledWith('bob', 'mypassword');
      expect(mockJwtSign).toHaveBeenCalledWith({ id: 'user-123' }, expect.objectContaining({ expiresIn: '30d' }));
      expect(mockCookie).toHaveBeenCalledWith('token', 'login-jwt', expect.any(Object));
    });

    it('throws FORBIDDEN when user status is not active', async () => {
      const caller = makeCaller();
      mockedLogin.mockResolvedValue({
        id: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: 'bob',
        passwordHash: 'hashed',
        public: false,
        status: 'pending_approval',
        role: 'member',
      });

      await expect(caller.login({ userName: 'bob', password: 'mypassword' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });

      expect(mockCookie).not.toHaveBeenCalled();
    });

    it('propagates UNAUTHORIZED from login service', async () => {
      const caller = makeCaller();
      mockedLogin.mockRejectedValue(new TRPCError({ code: 'UNAUTHORIZED' }));

      await expect(caller.login({ userName: 'bob', password: 'wrong' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('logout', () => {
    it('clears the token cookie', async () => {
      const caller = makeCaller();

      await caller.logout();

      expect(mockClearCookie).toHaveBeenCalledWith('token', expect.objectContaining({ httpOnly: true, signed: true }));
    });
  });
});
