import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server', () => ({ checkRateLimit: vi.fn() }));
vi.mock('../../db/db', () => ({ db: {} }));
vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

import { createCallerFactory } from '../../routers/__tests__/routerTestHelpers';
import { checkRateLimit } from '../../server';
import type { Context } from '../context';
import { adminProcedure, privateProcedure, rateLimitedPublicProcedure, router } from '../trpc';

const mockedCheckRateLimit = vi.mocked(checkRateLimit);

const testRouter = router({
  privateEcho: privateProcedure.query(({ ctx }) => ctx.currentUser.id),
  adminEcho: adminProcedure.query(({ ctx }) => ctx.currentUser.role),
  rateLimitedEcho: rateLimitedPublicProcedure.query(() => 'ok'),
});

const createCaller = createCallerFactory(testRouter);

function authedCaller(userId = randomUUID(), role: 'admin' | 'member' = 'member') {
  return createCaller({
    req: {} as Context['req'],
    res: {} as Context['res'],
    currentUser: { isAuthenticated: true, id: userId, role },
  });
}

function unauthenticatedCaller() {
  return createCaller({
    req: {} as Context['req'],
    res: {} as Context['res'],
    currentUser: { isAuthenticated: false },
  });
}

describe('privateProcedure', () => {
  it('allows authenticated users and narrows context', async () => {
    const userId = randomUUID();
    const caller = authedCaller(userId);

    const result = await caller.privateEcho();

    expect(result).toBe(userId);
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = unauthenticatedCaller();

    await expect(caller.privateEcho()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('adminProcedure', () => {
  it('allows admin users', async () => {
    const caller = authedCaller(randomUUID(), 'admin');

    const result = await caller.adminEcho();

    expect(result).toBe('admin');
  });

  it('throws FORBIDDEN for non-admin users', async () => {
    const caller = authedCaller(randomUUID(), 'member');

    await expect(caller.adminEcho()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws UNAUTHORIZED for unauthenticated users', async () => {
    const caller = unauthenticatedCaller();

    await expect(caller.adminEcho()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('rateLimitedPublicProcedure', () => {
  beforeEach(() => {
    mockedCheckRateLimit.mockResolvedValue({
      isAllowed: true,
      key: 'test',
    } as Awaited<ReturnType<typeof checkRateLimit>>);
  });

  it('allows requests within rate limit', async () => {
    const caller = unauthenticatedCaller();

    const result = await caller.rateLimitedEcho();

    expect(result).toBe('ok');
  });

  it('throws TOO_MANY_REQUESTS when rate limit is exceeded', async () => {
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
    const caller = unauthenticatedCaller();

    await expect(caller.rateLimitedEcho()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  });

  it('allows requests that are not allowed but not exceeded', async () => {
    mockedCheckRateLimit.mockResolvedValue({
      isAllowed: false,
      isExceeded: false,
      key: 'test',
    } as Awaited<ReturnType<typeof checkRateLimit>>);
    const caller = unauthenticatedCaller();

    const result = await caller.rateLimitedEcho();

    expect(result).toBe('ok');
  });
});
