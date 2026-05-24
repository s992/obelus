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

import { login, register } from '../../auth/auth';
import { checkRateLimit } from '../../server';
import type { Context } from '../../trpc/context';
import { authRouter } from '../authRouter';

const mockedRegister = vi.mocked(register);
const mockedLogin = vi.mocked(login);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

const t = initTRPC.context<Context>().create();
const createCaller = t.createCallerFactory(authRouter);

function makeCaller() {
  return createCaller({
    req: { server: { jwt: { sign: mockJwtSign } } } as unknown as Context['req'],
    res: { cookie: mockCookie, clearCookie: mockClearCookie } as unknown as Context['res'],
    currentUser: { isAuthenticated: false, id: undefined },
  });
}

describe('authRouter', () => {
  beforeEach(() => {
    mockedCheckRateLimit.mockResolvedValue({
      isAllowed: true,
      key: 'test',
    } as Awaited<ReturnType<typeof checkRateLimit>>);
  });

  describe('register', () => {
    it('registers the user and sets a signed cookie', async () => {
      const caller = makeCaller();
      mockedRegister.mockResolvedValue('new-user-id');
      mockJwtSign.mockReturnValue('jwt-token-value');

      await caller.register({ userName: 'alice', password: 'securepassword' });

      expect(mockedRegister).toHaveBeenCalledWith('alice', 'securepassword');
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
    });

    it('throws INTERNAL_SERVER_ERROR when register returns no userId', async () => {
      const caller = makeCaller();
      mockedRegister.mockResolvedValue(undefined);

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
      };
      mockedLogin.mockResolvedValue(user);
      mockJwtSign.mockReturnValue('login-jwt');

      await caller.login({ userName: 'bob', password: 'mypassword' });

      expect(mockedLogin).toHaveBeenCalledWith('bob', 'mypassword');
      expect(mockJwtSign).toHaveBeenCalledWith({ id: 'user-123' }, expect.objectContaining({ expiresIn: '30d' }));
      expect(mockCookie).toHaveBeenCalledWith('token', 'login-jwt', expect.any(Object));
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
