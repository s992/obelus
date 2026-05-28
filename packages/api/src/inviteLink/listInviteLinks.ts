import type { InviteLinkStatus, Maybe } from '@obelus/shared/types';

import { db } from '../db/db';
import { listInviteLinks as listInviteLinksQuery } from '../sqlc/invite_link_sql';

export const PAGE_SIZE = 25;

export async function listInviteLinks(cursor: Maybe<string>, status: Maybe<InviteLinkStatus>) {
  const links = await listInviteLinksQuery(db, {
    cursor: decodeCursor(cursor),
    status: status ?? null,
    pagesize: PAGE_SIZE + 1,
  });

  const hasMore = links.length > PAGE_SIZE;
  const count = links[0]?.totalCount;

  if (hasMore) {
    links.pop();
  }

  return {
    links,
    hasNextPage: hasMore,
    nextPageToken: hasMore ? encodeCursor(links[links.length - 1]?.expiresAt) : null,
    totalCount: count ? parseInt(count) : 0,
  };
}

function encodeCursor(value: Maybe<Date>) {
  if (!value) {
    return null;
  }

  return Buffer.from(value).toString('base64url');
}

function decodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return new Date(Buffer.from(cursor, 'base64url').toString());
}
