import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listNotesQuery = `-- name: ListNotes :many
select
  n.id,
  n.content,
  n.created_at
from note n
inner join record r on r.id = n.record_id
where n.user_id = $1
and r.user_id = $1
and n.record_id = $2
order by n.created_at desc`;

export interface ListNotesArgs {
  userid: string;
  recordid: string;
}

export interface ListNotesRow {
  id: string;
  content: string;
  createdAt: Date;
}

export async function listNotes(client: Client, args: ListNotesArgs): Promise<ListNotesRow[]> {
  const result = await client.query({
    text: listNotesQuery,
    values: [args.userid, args.recordid],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      content: row[1],
      createdAt: row[2],
    };
  });
}

export const createNoteQuery = `-- name: CreateNote :exec
insert into note (
  record_id,
  content,
  user_id
) values (
  $1,
  $2,
  $3
)`;

export interface CreateNoteArgs {
  recordid: string;
  content: string;
  userid: string;
}

export async function createNote(client: Client, args: CreateNoteArgs): Promise<void> {
  await client.query({
    text: createNoteQuery,
    values: [args.recordid, args.content, args.userid],
    rowMode: 'array',
  });
}
