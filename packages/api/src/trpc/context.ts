import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import type { UserRole } from '@obelus/shared/types';

import { parseJwt } from '../auth/jwt';
import { db } from '../db/db';
import { logger } from '../log';
import { getUserById } from '../sqlc/user_sql';

type UnauthenticatedUser = { isAuthenticated: false };
type AuthenticatedUser = { isAuthenticated: true; id: string; role: UserRole };

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const user = await loadUserFromCookie(opts);

  if (!user) {
    return { req, res, currentUser: { isAuthenticated: false } as UnauthenticatedUser };
  }

  return { req, res, currentUser: { isAuthenticated: true, id: user.id, role: user.role } as AuthenticatedUser };
}

async function loadUserFromCookie({ req }: CreateFastifyContextOptions) {
  const jwt = await parseJwt(req.cookies['token']);

  if (!jwt?.id) {
    logger.debug('bailing because jwt is missing id');
    return null;
  }

  try {
    const user = await getUserById(db, { userid: jwt.id });

    if (!user) {
      logger.debug(jwt, 'bailing because we could not find the user');
      return null;
    }

    return user;
  } catch (err) {
    logger.error(err, 'failed to load user in context');
  }

  return null;
}

export type Context = Awaited<ReturnType<typeof createContext>>;
