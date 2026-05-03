import { TRPCError } from '@trpc/server';
import * as argon2 from 'argon2';
import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { logger } from '../log';
import { createUser, getUserByUserName } from '../user/user';

export async function register(userName: string, password: string) {
  const hashed = await hashPassword(password);

  try {
    const user = await createUser({ userName, passwordHash: hashed });

    return user;
  } catch (err) {
    if (!(err instanceof DrizzleQueryError)) {
      throw err;
    }

    if (!(err.cause instanceof DatabaseError)) {
      throw err.cause;
    }

    if (err.cause.code === '23505') {
      throw new TRPCError({ code: 'CONFLICT' });
    }

    throw err.cause;
  }
}

export async function login(userName: string, password: string) {
  const user = await getUserByUserName(userName);

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);

  if (!isValidPassword) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return user;
}

function hashPassword(password: string) {
  return argon2.hash(password);
}

async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    logger.error(err, 'argon2 errored while trying to verify password');
    return false;
  }
}
