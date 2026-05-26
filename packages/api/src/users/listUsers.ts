import type { Maybe, UserRole, UserStatus } from '@obelus/shared/types';

import { db } from '../db/db';
import { listUsers as listUsersQuery } from '../sqlc/user_sql';

export const PAGE_SIZE = 25;

export async function listUsers(cursor: Maybe<string>, status: Maybe<UserStatus>, role: Maybe<UserRole>) {
  const users = await listUsersQuery(db, {
    cursor: decodeCursor(cursor),
    pagesize: PAGE_SIZE + 1,
    role: role ?? null,
    status: status ?? null,
  });

  const hasMore = users.length > PAGE_SIZE;
  const count = users[0]?.totalCount;

  if (hasMore) {
    users.pop();
  }

  return {
    users,
    hasNextPage: hasMore,
    nextPageToken: hasMore ? encodeCursor(users[users.length - 1]?.userName) : null,
    totalCount: count ? parseInt(count) : 0,
  };
}

function encodeCursor(value: Maybe<string>) {
  if (!value) {
    return null;
  }

  return Buffer.from(value).toString('base64url');
}

function decodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return Buffer.from(cursor, 'base64url').toString();
}
