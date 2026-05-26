import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const hasUsersQuery = `-- name: HasUsers :one
select exists(
  select 1
  from users
  limit 1
) as users_exist`;

export interface HasUsersRow {
  usersExist: string;
}

export async function hasUsers(client: Client): Promise<HasUsersRow | null> {
  const result = await client.query({
    text: hasUsersQuery,
    values: [],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    usersExist: row?.[0],
  };
}

export const getUserByIdQuery = `-- name: GetUserById :one
select id, created_at, updated_at, user_name, password_hash, public, status, role
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
  status: string;
  role: string;
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
    status: row?.[6],
    role: row?.[7],
  };
}

export const getUserByUserNameQuery = `-- name: GetUserByUserName :one
select id, created_at, updated_at, user_name, password_hash, public, status, role
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
  status: string;
  role: string;
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
    status: row?.[6],
    role: row?.[7],
  };
}

export const createUserQuery = `-- name: CreateUser :one
insert into users (
  user_name,
  password_hash,
  status,
  role
) values (
  $1,
  $2,
  $3,
  $4
)
returning id, status`;

export interface CreateUserArgs {
  username: string;
  passwordhash: string;
  registrationstatus: string;
  role: string;
}

export interface CreateUserRow {
  id: string;
  status: string;
}

export async function createUser(client: Client, args: CreateUserArgs): Promise<CreateUserRow | null> {
  const result = await client.query({
    text: createUserQuery,
    values: [args.username, args.passwordhash, args.registrationstatus, args.role],
    rowMode: 'array',
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row?.[0],
    status: row?.[1],
  };
}

export const updateUserQuery = `-- name: UpdateUser :exec
update users
set
  password_hash = coalesce($1, password_hash),
  public = coalesce($2::boolean, public),
  status = coalesce($3, status),
  role = coalesce($4, role)
where id = $5`;

export interface UpdateUserArgs {
  passwordhash: string | null;
  public: boolean | null;
  status: string | null;
  role: string | null;
  userid: string;
}

export async function updateUser(client: Client, args: UpdateUserArgs): Promise<void> {
  await client.query({
    text: updateUserQuery,
    values: [args.passwordhash, args.public, args.status, args.role, args.userid],
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
and u.status = 'active'
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

export const listUsersQuery = `-- name: ListUsers :many
with filtered_users as (
  select
    id,
    user_name,
    created_at,
    status,
    role
  from users
  where (
    $3::user_registration_status is null
    or status = $3::user_registration_status
  )
  and (
    $4::user_role is null
    or role = $4::user_role
  )
)
select
  id,
  user_name,
  created_at,
  status,
  role,
  (select count(*) from filtered_users) as total_count
from filtered_users
where (
  $1::text is null
  or user_name > $1::text
)
order by user_name asc
limit $2::integer`;

export interface ListUsersArgs {
  cursor: string | null;
  pagesize: number;
  status: string | null;
  role: string | null;
}

export interface ListUsersRow {
  id: string;
  userName: string;
  createdAt: Date;
  status: string;
  role: string;
  totalCount: string;
}

export async function listUsers(client: Client, args: ListUsersArgs): Promise<ListUsersRow[]> {
  const result = await client.query({
    text: listUsersQuery,
    values: [args.cursor, args.pagesize, args.status, args.role],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      id: row[0],
      userName: row[1],
      createdAt: row[2],
      status: row[3],
      role: row[4],
      totalCount: row[5],
    };
  });
}
