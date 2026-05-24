import { describe, expect, it, vi } from 'vitest';

import type { JWTPayload } from '../../types';

const mockUnsignCookie = vi.fn();
const mockJwtVerify = vi.fn();

vi.mock('../../server', () => ({
  server: {
    unsignCookie: (...args: unknown[]) => mockUnsignCookie(...args),
    jwt: { verify: (...args: unknown[]) => mockJwtVerify(...args) },
  },
}));

vi.mock('../../log', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }));

import { parseJwt } from '../jwt';

const validPayload = {
  id: 'user-abc',
  exp: 9999999999,
  iat: '2025-01-01T00:00:00Z',
} satisfies JWTPayload;

describe('parseJwt', () => {
  it('returns null when tokenCookie is null', async () => {
    expect(await parseJwt(null)).toBeNull();
  });

  it('returns null when tokenCookie is undefined', async () => {
    expect(await parseJwt(undefined)).toBeNull();
  });

  it('returns null when the cookie signature is invalid', async () => {
    mockUnsignCookie.mockReturnValue({ valid: false, value: null });

    expect(await parseJwt('bad-cookie')).toBeNull();
  });

  it('returns the decoded payload for a valid signed cookie', async () => {
    mockUnsignCookie.mockReturnValue({ valid: true, value: 'raw-jwt-token' });
    mockJwtVerify.mockReturnValue(validPayload);

    const result = await parseJwt('signed-cookie');

    expect(result).toEqual(validPayload);
    expect(mockJwtVerify).toHaveBeenCalledWith('raw-jwt-token');
  });

  it('returns null when jwt.verify throws', async () => {
    mockUnsignCookie.mockReturnValue({ valid: true, value: 'expired-token' });
    mockJwtVerify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    expect(await parseJwt('signed-cookie')).toBeNull();
  });
});
