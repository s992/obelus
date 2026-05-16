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
