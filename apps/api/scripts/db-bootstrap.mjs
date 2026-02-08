import { execSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;

const defaultAppUrl = "postgres://postgres:postgres@localhost:5432/obelus";

const appDatabaseUrl = process.env.DATABASE_URL ?? defaultAppUrl;
const appUrl = new URL(appDatabaseUrl);

const appUser = decodeURIComponent(appUrl.username);
const appPassword = decodeURIComponent(appUrl.password);
const appDatabase = appUrl.pathname.replace(/^\//, "");

if (!appUser) {
  throw new Error("DATABASE_URL must include a username.");
}

if (!appDatabase) {
  throw new Error("DATABASE_URL must include a database name.");
}

const adminDatabaseUrl =
  process.env.ADMIN_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

const quoteIdent = (value) => `"${value.replace(/"/g, '""')}"`;
const quoteLiteral = (value) => `'${value.replace(/'/g, "''")}'`;

const ensureRoleAndDatabase = async () => {
  const adminClient = new Client({ connectionString: adminDatabaseUrl });
  await adminClient.connect();

  try {
    const roleCheck = await adminClient.query("select 1 from pg_roles where rolname = $1", [
      appUser,
    ]);

    if (roleCheck.rowCount === 0) {
      if (appPassword) {
        await adminClient.query(
          `create role ${quoteIdent(appUser)} login password ${quoteLiteral(appPassword)}`,
        );
      } else {
        await adminClient.query(`create role ${quoteIdent(appUser)} login`);
      }
      console.log(`Created role: ${appUser}`);
    } else if (appPassword) {
      await adminClient.query(
        `alter role ${quoteIdent(appUser)} with login password ${quoteLiteral(appPassword)}`,
      );
      console.log(`Updated role password: ${appUser}`);
    } else {
      console.log(`Role exists: ${appUser}`);
    }

    const dbCheck = await adminClient.query("select 1 from pg_database where datname = $1", [
      appDatabase,
    ]);
    if (dbCheck.rowCount === 0) {
      await adminClient.query(
        `create database ${quoteIdent(appDatabase)} owner ${quoteIdent(appUser)}`,
      );
      console.log(`Created database: ${appDatabase}`);
    } else {
      console.log(`Database exists: ${appDatabase}`);
    }

    await adminClient.query(
      `grant all privileges on database ${quoteIdent(appDatabase)} to ${quoteIdent(appUser)}`,
    );
  } finally {
    await adminClient.end();
  }

  const appClient = new Client({ connectionString: appDatabaseUrl });
  await appClient.connect();
  try {
    await appClient.query(`grant usage, create on schema public to ${quoteIdent(appUser)}`);
    await appClient.query(
      `grant all privileges on all tables in schema public to ${quoteIdent(appUser)}`,
    );
    await appClient.query(
      `grant all privileges on all sequences in schema public to ${quoteIdent(appUser)}`,
    );
    await appClient.query(
      `alter default privileges in schema public grant all on tables to ${quoteIdent(appUser)}`,
    );
    await appClient.query(
      `alter default privileges in schema public grant all on sequences to ${quoteIdent(appUser)}`,
    );
  } finally {
    await appClient.end();
  }
};

const run = async () => {
  await ensureRoleAndDatabase();

  execSync("pnpm --filter @obelus/api db:migrate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: appDatabaseUrl,
    },
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
