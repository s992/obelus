import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { logger } from '../log';
import { JWTPayload, Maybe } from '../types';
import { getUserById } from '../user/user';

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const user = await loadUserFromCookie(opts);

  return { req, res, currentUser: { isAuthenticated: !!user?.id, id: user?.id } };
}

async function loadUserFromCookie({ req }: CreateFastifyContextOptions) {
  const tokenCookie = req.cookies['token'];

  if (!tokenCookie) {
    return null;
  }

  const unsigned = req.unsignCookie(tokenCookie);

  if (!unsigned.valid) {
    return null;
  }

  let verified: Maybe<JWTPayload>;

  try {
    verified = req.server.jwt.verify<JWTPayload>(unsigned.value);
  } catch (err) {
    logger.error(err, 'failed to verify jwt');
  }

  if (!verified?.id) {
    return null;
  }

  try {
    const user = await getUserById(verified.id);

    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    logger.error(err, 'failed to load user in context');
  }

  return null;
}

export type Context = Awaited<ReturnType<typeof createContext>>;
