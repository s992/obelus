import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createInviteLinkQuery = `-- name: CreateInviteLink :exec
insert into invite_link (
  token,
  expires_at,
  created_by
) values (
  $1,
  $2,
  $3
)`;

export interface CreateInviteLinkArgs {
  token: string;
  expiresat: Date;
  createdby: string;
}

export async function createInviteLink(client: Client, args: CreateInviteLinkArgs): Promise<void> {
  await client.query({
    text: createInviteLinkQuery,
    values: [args.token, args.expiresat, args.createdby],
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
with filtered_links as (
  select id, created_at, created_by, token, expires_at, used_at, used_by
  from invite_link
  where $3::text is null
  or case
    when used_by is not null then 'used'
    when used_at is not null and used_by is null then 'invalidated'
    else 'active'
  end = $3::text
),
total as (
  select count(*) as total_count
  from filtered_links
)
select
  fl.id,
  fl.token,
  fl.expires_at,
  fl.used_at,
  fl.used_by,
  u.user_name,
  t.total_count
from filtered_links fl
cross join total t
left join users u on u.id = fl.used_by
where (
  $1::timestamptz is null
  or expires_at < $1::timestamptz
)
order by expires_at desc
limit $2::integer`;

export interface ListInviteLinksArgs {
  cursor: Date | null;
  pagesize: number;
  status: string | null;
}

export interface ListInviteLinksRow {
  id: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: string | null;
  userName: string | null;
  totalCount: string;
}

export async function listInviteLinks(client: Client, args: ListInviteLinksArgs): Promise<ListInviteLinksRow[]> {
  const result = await client.query({
    text: listInviteLinksQuery,
    values: [args.cursor, args.pagesize, args.status],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      token: row[1],
      expiresAt: row[2],
      usedAt: row[3],
      usedBy: row[4],
      userName: row[5],
      totalCount: row[6],
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

export const invalidateInviteLinkQuery = `-- name: InvalidateInviteLink :exec
update invite_link
set
  used_at = now(),
  used_by = null
where id = $1
and used_by is null`;

export interface InvalidateInviteLinkArgs {
  id: string;
}

export async function invalidateInviteLink(client: Client, args: InvalidateInviteLinkArgs): Promise<void> {
  await client.query({
    text: invalidateInviteLinkQuery,
    values: [args.id],
    rowMode: 'array',
  });
}
