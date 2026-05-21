import { RecordSchema } from '@obelus/shared/schema';
import type { Judgment, Maybe, SortField, Status } from '@obelus/shared/types';
import z from 'zod';

import { db } from '../db/db';
import { client } from '../gql/client';
import { type ListRecordsRow, listRecords } from '../sqlc/record_sql';
import { collateRecordsAndBooks } from './collateRecordsAndBooks';

const PAGE_SIZE = 20;

export async function listUserRecords(
  userId: string,
  cursor: Maybe<string>,
  sortField: SortField,
  status: Status,
  judgment: Maybe<Judgment>,
) {
  const records = await listRecords(db, {
    cursor: decodeCursor(cursor),
    pagesize: PAGE_SIZE + 1,
    status: status,
    judgment: judgment ?? null,
    userid: userId,
    sortfield: sortField,
  });

  const hasMore = records.length > PAGE_SIZE;

  if (hasMore) {
    records?.pop();
  }

  const bookIds = records.map((record) => record.bookId);
  const { books } = await client.GetBooksByIds({ ids: bookIds });
  const count = records[0]?.totalCount;

  return {
    books: collateRecordsAndBooks(z.array(RecordSchema).parse(records), books),
    hasNextPage: hasMore,
    nextPageToken: hasMore ? encodeCursor(records[records.length - 1], sortField) : null,
    totalCount: count ? parseInt(count) : 0,
  };
}

function encodeCursor(row: Maybe<ListRecordsRow>, sortField: SortField) {
  if (!row) {
    return null;
  }

  let date: Date | null;

  switch (sortField) {
    case 'finished_at':
      date = row.finishedAt;
      break;
    case 'started_at':
      date = row.startedAt;
      break;
    default:
      date = row.updatedAt;
  }

  if (!date) {
    return null;
  }

  return Buffer.from(date.toISOString()).toString('base64url');
}

function decodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return new Date(Buffer.from(cursor, 'base64url').toString());
}
