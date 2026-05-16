import type { QueryArrayConfig, QueryArrayResult } from 'pg';

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listMigrationsQuery = `-- name: ListMigrations :many
select name, applied_at
from migration`;

export interface ListMigrationsRow {
  name: string;
  appliedAt: Date | null;
}

export async function listMigrations(client: Client): Promise<ListMigrationsRow[]> {
  const result = await client.query({
    text: listMigrationsQuery,
    values: [],
    rowMode: 'array',
  });
  return result.rows.map((row) => {
    return {
      name: row[0],
      appliedAt: row[1],
    };
  });
}

export const createMigrationQuery = `-- name: CreateMigration :exec
insert into migration (
  name,
  applied_at
) values (
  $1,
  now()
)`;

export interface CreateMigrationArgs {
  name: string;
}

export async function createMigration(client: Client, args: CreateMigrationArgs): Promise<void> {
  await client.query({
    text: createMigrationQuery,
    values: [args.name],
    rowMode: 'array',
  });
}
