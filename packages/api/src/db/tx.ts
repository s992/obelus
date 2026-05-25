import type { PoolClient } from 'pg';

import { db } from './db';

type ExecCallback<T> = (client: PoolClient) => Promise<T>;

export async function tx<T>(exec: ExecCallback<T>) {
  const client = await db.connect();

  try {
    await client.query('begin');
    const result = await exec(client);
    await client.query('commit');

    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
