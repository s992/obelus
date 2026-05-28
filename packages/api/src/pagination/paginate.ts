import type { Maybe } from '@obelus/shared/types';

type QueryFnArgs = {
  cursor: string | null;
  pageSize: number;
};

type Args<T> = {
  currentCursor: Maybe<string>;
  pageSize: number;
  queryFn: (args: QueryFnArgs) => Promise<T[]>;
  getNextCursor: (row: T) => string | null;
  getCount: (row: T) => number;
};

export async function paginate<T>({ currentCursor, queryFn, getNextCursor, getCount, pageSize }: Args<T>) {
  const decodedCursor = decodeCursor(currentCursor);
  const records = await queryFn({ cursor: decodedCursor, pageSize: pageSize + 1 });
  const hasMore = records.length > pageSize;

  if (hasMore) {
    records.pop();
  }

  const lastRow = records[records.length - 1];
  const nextCursor = lastRow ? encodeCursor(getNextCursor(lastRow)) : null;
  const count = lastRow ? getCount(lastRow) : 0;

  return {
    records,
    hasNextPage: hasMore,
    nextPageToken: hasMore ? nextCursor : null,
    totalCount: count,
    pageSize,
  };
}

function encodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return Buffer.from(cursor).toString('base64url');
}

function decodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return Buffer.from(cursor, 'base64url').toString();
}
