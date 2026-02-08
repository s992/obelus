import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../lib/env.js";

const { Pool } = pg;

const resolveMigrationsFolder = (): string => {
  const configured = process.env.DRIZZLE_MIGRATIONS_DIR;
  if (configured && configured.trim().length > 0) {
    return resolve(process.cwd(), configured);
  }

  return resolve(process.cwd(), "apps/api/drizzle");
};

const run = async () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: resolveMigrationsFolder() });
    console.log("Database migrations applied successfully.");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
