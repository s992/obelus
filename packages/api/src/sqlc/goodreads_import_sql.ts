import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createGoodreadsImportQuery = `-- name: CreateGoodreadsImport :one
insert into goodreads_import (
  job_id,
  user_id
) values (
  $1,
  $2
) returning id`;

export interface CreateGoodreadsImportArgs {
  jobid: string;
  userid: string;
}

export interface CreateGoodreadsImportRow {
  id: string;
}

export async function createGoodreadsImport(
  client: Client,
  args: CreateGoodreadsImportArgs,
): Promise<CreateGoodreadsImportRow | null> {
  const result = await client.query({
    text: createGoodreadsImportQuery,
    values: [args.jobid, args.userid],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
  };
}

export const createGoodreadsImportFailureQuery = `-- name: CreateGoodreadsImportFailure :exec
insert into goodreads_import_failure (
  import_id,
  title,
  author
) values (
  $1,
  $2,
  $3
)`;

export interface CreateGoodreadsImportFailureArgs {
  importid: string;
  title: string;
  author: string;
}

export async function createGoodreadsImportFailure(
  client: Client,
  args: CreateGoodreadsImportFailureArgs,
): Promise<void> {
  await client.query({
    text: createGoodreadsImportFailureQuery,
    values: [args.importid, args.title, args.author],
    rowMode: 'array',
  });
}

export const getGoodreadsImportIdByJobIdQuery = `-- name: GetGoodreadsImportIdByJobId :one
select id
from goodreads_import
where job_id = $1`;

export interface GetGoodreadsImportIdByJobIdArgs {
  jobid: string;
}

export interface GetGoodreadsImportIdByJobIdRow {
  id: string;
}

export async function getGoodreadsImportIdByJobId(
  client: Client,
  args: GetGoodreadsImportIdByJobIdArgs,
): Promise<GetGoodreadsImportIdByJobIdRow | null> {
  const result = await client.query({
    text: getGoodreadsImportIdByJobIdQuery,
    values: [args.jobid],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
  };
}

export const finishGoodreadsImportQuery = `-- name: FinishGoodreadsImport :exec
update goodreads_import
set
  completed_at = NOW(),
  success_count = $1::integer
where job_id = $2`;

export interface FinishGoodreadsImportArgs {
  successcount: number;
  jobid: string;
}

export async function finishGoodreadsImport(client: Client, args: FinishGoodreadsImportArgs): Promise<void> {
  await client.query({
    text: finishGoodreadsImportQuery,
    values: [args.successcount, args.jobid],
    rowMode: 'array',
  });
}

export const listGoodreadsImportsQuery = `-- name: ListGoodreadsImports :many
select
  gi.id,
  gi.created_at,
  gi.completed_at,
  coalesce(gi.success_count, 0) as success_count,
  coalesce(json_agg(gif) filter (where gif.id is not null), '[]') as failures
from goodreads_import gi
left join goodreads_import_failure gif on gif.import_id = gi.id
where gi.user_id = $1
group by gi.id
order by gi.created_at desc`;

export interface ListGoodreadsImportsArgs {
  userid: string;
}

export interface ListGoodreadsImportsRow {
  id: string;
  createdAt: Date;
  completedAt: Date | null;
  successCount: number;
  failures: any | null;
}

export async function listGoodreadsImports(
  client: Client,
  args: ListGoodreadsImportsArgs,
): Promise<ListGoodreadsImportsRow[]> {
  const result = await client.query({
    text: listGoodreadsImportsQuery,
    values: [args.userid],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      createdAt: row[1],
      completedAt: row[2],
      successCount: row[3],
      failures: row[4],
    };
  });
}
