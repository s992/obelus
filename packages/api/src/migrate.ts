import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { db } from './db/db';
import { createMigration, listMigrations } from './sqlc/migrations_sql';

async function migrate() {
  await db.query('select pg_advisory_lock(1)');

  const applied = await listMigrations(db);
  const appliedSet = new Set(applied.map((row) => row.name));
  const baseDir = join(__dirname, 'sql/migrations');
  const migrationFiles = (await readdir(baseDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of migrationFiles) {
    if (appliedSet.has(file)) {
      continue;
    }

    const sql = await readFile(join(baseDir, file), 'utf8');

    await db.query('begin;');

    try {
      await db.query(sql);
      await createMigration(db, { name: file });
      await db.query('commit;');
    } catch (err) {
      await db.query('rollback;');
      throw err;
    }
  }

  await db.query('select pg_advisory_unlock(1)');
  await db.end();
}

migrate();
