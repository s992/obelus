import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createInviteLinkQuery = `-- name: CreateInviteLink :exec
insert into invite_link (
  token,
  expires_at
) values (
  $1,
  $2
)`;

export interface CreateInviteLinkArgs {
  token: string;
  expiresat: Date;
}

export async function createInviteLink(client: Client, args: CreateInviteLinkArgs): Promise<void> {
  await client.query({
    text: createInviteLinkQuery,
    values: [args.token, args.expiresat],
    rowMode: 'array',
  });
}

export const getInviteLinkQuery = `-- name: GetInviteLink :one
select id, created_at, created_by, token, expires_at, used_at, used_by
from invite_link
where token = $1`;

export interface GetInviteLinkArgs {
  token: string;
}

export interface GetInviteLinkRow {
  id: string;
  createdAt: Date;
  createdBy: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: string | null;
}

export async function getInviteLink(client: Client, args: GetInviteLinkArgs): Promise<GetInviteLinkRow | null> {
  const result = await client.query({
    text: getInviteLinkQuery,
    values: [args.token],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
    createdAt: row?.[1],
    createdBy: row?.[2],
    token: row?.[3],
    expiresAt: row?.[4],
    usedAt: row?.[5],
    usedBy: row?.[6],
  };
}

export const listInviteLinksQuery = `-- name: ListInviteLinks :many
select id, created_at, created_by, token, expires_at, used_at, used_by
from invite_link`;

export interface ListInviteLinksRow {
  id: string;
  createdAt: Date;
  createdBy: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: string | null;
}

export async function listInviteLinks(client: Client): Promise<ListInviteLinksRow[]> {
  const result = await client.query({
    text: listInviteLinksQuery,
    values: [],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      createdAt: row[1],
      createdBy: row[2],
      token: row[3],
      expiresAt: row[4],
      usedAt: row[5],
      usedBy: row[6],
    };
  });
}

export const useInviteLinkQuery = `-- name: UseInviteLink :exec
update invite_link
set
  used_at = now(),
  used_by = $1
where token = $2`;

export interface UseInviteLinkArgs {
  userid: string | null;
  token: string;
}

export async function useInviteLink(client: Client, args: UseInviteLinkArgs): Promise<void> {
  await client.query({
    text: useInviteLinkQuery,
    values: [args.userid, args.token],
    rowMode: 'array',
  });
}
