import { drizzle } from "drizzle-orm/node-postgres";
import Redis from "ioredis";
import pg from "pg";
import { env } from "../lib/env.js";

const { Pool } = pg;

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool);

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  retryStrategy: () => null,
});

redis.on("error", () => {
  // Redis is optional in local/dev; cache falls back to Postgres-backed storage.
});

export const checkDatabaseReadiness = async (): Promise<boolean> => {
  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  }
};
