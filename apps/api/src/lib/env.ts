import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRootDir = resolve(currentDir, "../..");
const workspaceRootDir = resolve(apiRootDir, "../..");

// Existing process env has highest precedence. Then load API-local .env, then workspace fallback.
loadDotenv({ path: resolve(apiRootDir, ".env") });
loadDotenv({ path: resolve(workspaceRootDir, ".env") });

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().default("http://localhost:5173"),
  APP_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/obelus"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_COOKIE_NAME: z.string().default("obelus_session"),
  SESSION_SECRET: z.string().min(16).default("change-this-development-secret"),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_AUTHORIZE_URL: optionalUrl,
  OAUTH_TOKEN_URL: optionalUrl,
  OAUTH_USERINFO_URL: optionalUrl,
  OAUTH_REDIRECT_URI: optionalUrl,
  OAUTH_SCOPES: z.string().default("openid email profile"),
});

export const env = envSchema.parse(process.env);
