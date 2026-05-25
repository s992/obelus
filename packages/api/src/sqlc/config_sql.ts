import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getConfigQuery = `-- name: GetConfig :one
select id, created_at, updated_at, updated_by, registration_strategy
from config`;

export interface GetConfigRow {
  id: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  registrationStrategy: string;
}

export async function getConfig(client: Client): Promise<GetConfigRow | null> {
  const result = await client.query({
    text: getConfigQuery,
    values: [],
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
    updatedBy: row?.[3],
    registrationStrategy: row?.[4],
  };
}

export const updateConfigQuery = `-- name: UpdateConfig :exec
update config
set
  registration_strategy = coalesce($1, registration_strategy),
  updated_by = $2`;

export interface UpdateConfigArgs {
  registrationstrategy: string | null;
  userid: string | null;
}

export async function updateConfig(client: Client, args: UpdateConfigArgs): Promise<void> {
  await client.query({
    text: updateConfigQuery,
    values: [args.registrationstrategy, args.userid],
    rowMode: 'array',
  });
}
