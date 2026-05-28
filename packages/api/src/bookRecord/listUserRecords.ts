import z from 'zod';

import { RecordSchema } from '@obelus/shared/schema';
import type { Judgment, Maybe, SortField, Status } from '@obelus/shared/types';

import { db } from '../db/db';
import { client } from '../gql/client';
import { paginate } from '../pagination/paginate';
import { listRecords } from '../sqlc/record_sql';
import { collateRecordsAndBooks } from './collateRecordsAndBooks';

export async function listUserRecords(
  userId: string,
  cursor: Maybe<string>,
  sortField: SortField,
  status: Status,
  judgment: Maybe<Judgment>,
) {
  const { records, ...rest } = await paginate({
    queryFn: ({ cursor, pageSize }) =>
      listRecords(db, {
        cursor: cursor ? new Date(cursor) : null,
        pagesize: pageSize,
        status: status,
        judgment: judgment ?? null,
        sortfield: sortField,
        userid: userId,
      }),
    getCount: (row) => parseInt(row.totalCount),
    currentCursor: cursor,
    pageSize: 20,
    getNextCursor: (row) => {
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

      return date ? date.toISOString() : null;
    },
  });

  const bookIds = records.map((record) => record.bookId);
  const { books } = await client.GetBooksByIds({ ids: bookIds });

  return {
    books: collateRecordsAndBooks(z.array(RecordSchema).parse(records), books),
    ...rest,
  };
}
