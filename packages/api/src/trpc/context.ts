import type { Maybe } from '@obelus/shared/types';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { db } from '../db/db';
import { logger } from '../log';
import { getUserById } from '../sqlc/user_sql';
import type { JWTPayload } from '../types';

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
    logger.debug('bailing because cookie is invalid');
    return null;
  }

  let verified: Maybe<JWTPayload>;

  try {
    verified = req.server.jwt.verify<JWTPayload>(unsigned.value);
  } catch (err) {
    logger.error(err, 'failed to verify jwt');
  }

  if (!verified?.id) {
    logger.debug('bailing because jwt is missing id');
    return null;
  }

  try {
    const user = await getUserById(db, { userid: verified.id });

    if (!user) {
      logger.debug(verified, 'bailing because we could not find the user');
      return null;
    }

    return user;
  } catch (err) {
    logger.error(err, 'failed to load user in context');
  }

  return null;
}

export type Context = Awaited<ReturnType<typeof createContext>>;
