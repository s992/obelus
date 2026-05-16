import { TRPCError } from '@trpc/server';
import * as argon2 from 'argon2';
import { DatabaseError } from 'pg';

import { db } from '../db/db';
import { logger } from '../log';
import { createUser, getUserByUserName } from '../sqlc/user_sql';

export async function register(userName: string, password: string) {
  const hashed = await hashPassword(password);

  try {
    const user = await createUser(db, { username: userName, passwordhash: hashed });

    return user?.id;
  } catch (err) {
    logger.error(err);
    if (!(err instanceof DatabaseError)) {
      throw err;
    }

    if (err.code === '23505') {
      throw new TRPCError({ code: 'CONFLICT' });
    }

    throw err;
  }
}

export async function login(userName: string, password: string) {
  const user = await getUserByUserName(db, { username: userName });

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);

  if (!isValidPassword) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return user;
}

export function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    logger.error(err, 'argon2 errored while trying to verify password');
    return false;
  }
}
