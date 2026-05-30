import { TRPCError } from '@trpc/server';
import * as argon2 from 'argon2';
import { DatabaseError } from 'pg';

import type { UserStatus } from '@obelus/shared/types';

import { db } from '../db/db';
import { tx } from '../db/tx';
import { logger } from '../log';
import { useInviteLink, type GetInviteLinkRow } from '../sqlc/invite_link_sql';
import { createUser, getUserByUserName, hasUsers } from '../sqlc/user_sql';

export async function register(
  userName: string,
  password: string,
  status: UserStatus,
  inviteLink: GetInviteLinkRow | null,
) {
  const hashed = await hashPassword(password);

  try {
    return await tx(async (client) => {
      await client.query('select pg_advisory_xact_lock(1)');
      const firstUserCheck = await hasUsers(client);

      // default the first user registered to "admin"
      const role = firstUserCheck?.usersExist ? 'member' : 'admin';

      const user = await createUser(client, {
        username: userName,
        passwordhash: hashed,
        registrationstatus: status,
        role,
      });

      if (inviteLink && user?.id) {
        await useInviteLink(client, { token: inviteLink.token, userid: user.id });
      }

      return user;
    });
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

  if (user.status !== 'active') {
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
