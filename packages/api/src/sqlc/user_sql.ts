import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getUserByIdQuery = `-- name: GetUserById :one
select id, created_at, updated_at, user_name, password_hash, public
from users
where id = $1`;

export interface GetUserByIdArgs {
  userid: string;
}

export interface GetUserByIdRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  passwordHash: string;
  public: boolean;
}

export async function getUserById(client: Client, args: GetUserByIdArgs): Promise<GetUserByIdRow | null> {
  const result = await client.query({
    text: getUserByIdQuery,
    values: [args.userid],
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
    userName: row?.[3],
    passwordHash: row?.[4],
    public: row?.[5],
  };
}

export const getUserByUserNameQuery = `-- name: GetUserByUserName :one
select id, created_at, updated_at, user_name, password_hash, public
from users
where user_name = $1`;

export interface GetUserByUserNameArgs {
  username: string;
}

export interface GetUserByUserNameRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  passwordHash: string;
  public: boolean;
}

export async function getUserByUserName(
  client: Client,
  args: GetUserByUserNameArgs,
): Promise<GetUserByUserNameRow | null> {
  const result = await client.query({
    text: getUserByUserNameQuery,
    values: [args.username],
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
    userName: row?.[3],
    passwordHash: row?.[4],
    public: row?.[5],
  };
}

export const createUserQuery = `-- name: CreateUser :one
insert into users (
  user_name,
  password_hash
) values (
  $1,
  $2
)
returning id`;

export interface CreateUserArgs {
  username: string;
  passwordhash: string;
}

export interface CreateUserRow {
  id: string;
}

export async function createUser(client: Client, args: CreateUserArgs): Promise<CreateUserRow | null> {
  const result = await client.query({
    text: createUserQuery,
    values: [args.username, args.passwordhash],
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

export const updateUserQuery = `-- name: UpdateUser :exec
update users
set
  password_hash = coalesce($1, password_hash),
  public = coalesce($2::boolean, public)
where id = $3`;

export interface UpdateUserArgs {
  passwordhash: string | null;
  public: boolean | null;
  userid: string;
}

export async function updateUser(client: Client, args: UpdateUserArgs): Promise<void> {
  await client.query({
    text: updateUserQuery,
    values: [args.passwordhash, args.public, args.userid],
    rowMode: 'array',
  });
}

export const getUserPublicProfileQuery = `-- name: GetUserPublicProfile :one
select
  u.id,
  u.user_name,
  u.public,
  count(r.id) as total_records,
  count(
    case when r.finished_at >= date_trunc('year', current_date) then 1 end
  ) as finished_this_year,
  count(case when r.status = 'reading' then 1 end) as reading_count,
  count(case when r.status = 'finished' then 1 end) as finished_count,
  count(case when r.status = 'planned' then 1 end) as planned_count,
  least(
    coalesce(min(r.created_at), 'infinity'),
    coalesce(min(r.started_at), 'infinity'),
    coalesce(min(r.finished_at), 'infinity')
  ) as oldest_record,
  max(r.updated_at) as last_updated
from users u
left join record r on r.user_id = u.id
where u.user_name = $1
group by u.id, u.user_name, u.public`;

export interface GetUserPublicProfileArgs {
  username: string;
}

export interface GetUserPublicProfileRow {
  id: string;
  userName: string;
  public: boolean;
  totalRecords: string;
  finishedThisYear: string;
  readingCount: string;
  finishedCount: string;
  plannedCount: string;
  oldestRecord: Date | null;
  lastUpdated: Date;
}

export async function getUserPublicProfile(
  client: Client,
  args: GetUserPublicProfileArgs,
): Promise<GetUserPublicProfileRow | null> {
  const result = await client.query({
    text: getUserPublicProfileQuery,
    values: [args.username],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
    userName: row?.[1],
    public: row?.[2],
    totalRecords: row?.[3],
    finishedThisYear: row?.[4],
    readingCount: row?.[5],
    finishedCount: row?.[6],
    plannedCount: row?.[7],
    oldestRecord: row?.[8],
    lastUpdated: row?.[9],
  };
}
