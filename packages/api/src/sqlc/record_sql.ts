import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listRecordsQuery = `-- name: ListRecords :many
with records_with_notes as (
  select
    r.id, r.created_at, r.updated_at, r.user_id, r.book_id, r.finished_at, r.judgment, r.started_at, r.status,
    coalesce(
      json_agg(n.* order by n.created_at desc)
      filter (where n.id is not null),
      '[]'
    ) as notes,
    greatest(r.updated_at, coalesce(max(n.created_at), r.updated_at)) as last_activity
  from record r
  left join note n on n.record_id = r.id
  where r.user_id = $4
  and r.status = $5
  group by r.id
)
select
  id,
  book_id,
  finished_at,
  started_at,
  last_activity as updated_at,
  judgment,
  status,
  created_at
from records_with_notes
where (
  $1::timestamp is null
  or (
    case $2::text
      when 'started_at' then started_at
      when 'finished_at' then finished_at
      else last_activity
    end
  ) < $1::timestamp
  or (
    $2::text in ('started_at', 'finished_at')
    and case $2::text
      when 'started_at' then started_at is null
      when 'finished_at' then finished_at is null
    end
  )
)
order by
  case when $2::text = 'started_at' then started_at
       when $2::text = 'finished_at' then finished_at
  end desc nulls last,
  last_activity desc
limit $3::integer`;

export interface ListRecordsArgs {
  cursor: Date | null;
  sortfield: string;
  pagesize: number;
  userid: string;
  status: string;
}

export interface ListRecordsRow {
  id: string;
  bookId: number;
  finishedAt: Date | null;
  startedAt: Date | null;
  updatedAt: Date | null;
  judgment: string | null;
  status: string;
  createdAt: Date;
}

export async function listRecords(client: Client, args: ListRecordsArgs): Promise<ListRecordsRow[]> {
  const result = await client.query({
    text: listRecordsQuery,
    values: [args.cursor, args.sortfield, args.pagesize, args.userid, args.status],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      bookId: row[1],
      finishedAt: row[2],
      startedAt: row[3],
      updatedAt: row[4],
      judgment: row[5],
      status: row[6],
      createdAt: row[7],
    };
  });
}

export const createRecordQuery = `-- name: CreateRecord :exec
insert into record (
  book_id,
  user_id,
  status,
  started_at,
  finished_at,
  judgment
) values (
  $1::integer,
  $2,
  $3,
  $4,
  $5,
  $6
)`;

export interface CreateRecordArgs {
  bookid: number;
  userid: string;
  status: string;
  startedat: Date | null;
  finishedat: Date | null;
  judgment: string | null;
}

export async function createRecord(client: Client, args: CreateRecordArgs): Promise<void> {
  await client.query({
    text: createRecordQuery,
    values: [args.bookid, args.userid, args.status, args.startedat, args.finishedat, args.judgment],
    rowMode: 'array',
  });
}

export const updateRecordQuery = `-- name: UpdateRecord :exec
update record
set
  finished_at = coalesce($1::timestamp, finished_at),
  started_at = coalesce($2::timestamp, started_at),
  judgment = $3::judgment,
  status = coalesce($4::record_status, status)
where id = $5
and user_id = $6`;

export interface UpdateRecordArgs {
  finishedat: Date | null;
  startedat: Date | null;
  judgment: string | null;
  status: string | null;
  id: string;
  userid: string;
}

export async function updateRecord(client: Client, args: UpdateRecordArgs): Promise<void> {
  await client.query({
    text: updateRecordQuery,
    values: [args.finishedat, args.startedat, args.judgment, args.status, args.id, args.userid],
    rowMode: 'array',
  });
}

export const getRecordByBookIdQuery = `-- name: GetRecordByBookId :one
select id, created_at, updated_at, user_id, book_id, finished_at, judgment, started_at, status
from record
where book_id = $1::integer
and user_id = $2`;

export interface GetRecordByBookIdArgs {
  bookid: number;
  userid: string;
}

export interface GetRecordByBookIdRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  bookId: number;
  finishedAt: Date | null;
  judgment: string | null;
  startedAt: Date | null;
  status: string;
}

export async function getRecordByBookId(
  client: Client,
  args: GetRecordByBookIdArgs,
): Promise<GetRecordByBookIdRow | null> {
  const result = await client.query({
    text: getRecordByBookIdQuery,
    values: [args.bookid, args.userid],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
    createdAt: row?.[1],
    updatedAt: row?.[2],
    userId: row?.[3],
    bookId: row?.[4],
    finishedAt: row?.[5],
    judgment: row?.[6],
    startedAt: row?.[7],
    status: row?.[8],
  };
}

export const listRecordsByBookIdsQuery = `-- name: ListRecordsByBookIds :many
select id, created_at, updated_at, user_id, book_id, finished_at, judgment, started_at, status
from record
where book_id = any($1::integer[])
and user_id = $2`;

export interface ListRecordsByBookIdsArgs {
  bookids: number[];
  userid: string;
}

export interface ListRecordsByBookIdsRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  bookId: number;
  finishedAt: Date | null;
  judgment: string | null;
  startedAt: Date | null;
  status: string;
}

export async function listRecordsByBookIds(
  client: Client,
  args: ListRecordsByBookIdsArgs,
): Promise<ListRecordsByBookIdsRow[]> {
  const result = await client.query({
    text: listRecordsByBookIdsQuery,
    values: [args.bookids, args.userid],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      createdAt: row[1],
      updatedAt: row[2],
      userId: row[3],
      bookId: row[4],
      finishedAt: row[5],
      judgment: row[6],
      startedAt: row[7],
      status: row[8],
    };
  });
}

export const deleteRecordQuery = `-- name: DeleteRecord :exec
delete
from record
where book_id = $1::integer
and user_id = $2`;

export interface DeleteRecordArgs {
  bookid: number;
  userid: string;
}

export async function deleteRecord(client: Client, args: DeleteRecordArgs): Promise<void> {
  await client.query({
    text: deleteRecordQuery,
    values: [args.bookid, args.userid],
    rowMode: 'array',
  });
}
