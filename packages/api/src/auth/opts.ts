import type { CookieSerializeOptions } from '@fastify/cookie';
import type { SignOptions } from '@fastify/jwt';

import { config } from '../config';

const { protocol, hostname } = new URL(config.OBELUS_BASE_URL);

export const JWT_OPTS = { expiresIn: '30d' } satisfies Partial<SignOptions>;
export const COOKIE_OPTS = {
  domain: hostname,
  path: '/',
  sameSite: true,
  secure: protocol === 'https:',
  signed: true,
  maxAge: 30 * 24 * 60 * 60, // 30 days, matches jwt
} satisfies CookieSerializeOptions;
