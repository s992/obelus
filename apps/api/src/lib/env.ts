import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRootDir = resolve(currentDir, "../../../..");

// Existing process env has highest precedence. Load workspace root .env as shared source.
loadDotenv({ path: resolve(workspaceRootDir, ".env") });

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  TRUST_PROXY: z.coerce.boolean().default(false),
  APP_ORIGIN: z.string().default("http://localhost:5173"),
  APP_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/obelus"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_COOKIE_NAME: z.string().default("obelus_session"),
  CSRF_COOKIE_NAME: z.string().default("obelus_csrf"),
  SESSION_SECRET: z.string().min(16).default("change-this-development-secret"),
  HARDCOVER_API_TOKEN: z.string().min(1).default("test-hardcover-token"),
  HARDCOVER_API_URL: z.string().url().default("https://api.hardcover.app/v1/graphql"),
  OAUTH_PROVIDER: z.enum(["oidc", "oauth2"]).default("oidc"),
  OAUTH_ISSUER: optionalUrl,
  OAUTH_JWKS_URL: optionalUrl,
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_AUTHORIZE_URL: optionalUrl,
  OAUTH_TOKEN_URL: optionalUrl,
  OAUTH_USERINFO_URL: optionalUrl,
  OAUTH_REDIRECT_URI: optionalUrl,
  OAUTH_SCOPES: z.string().default("openid email profile"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const hardcoverTokenIssue = parsed.error.issues.find(
    (issue) => issue.path[0] === "HARDCOVER_API_TOKEN",
  );

  if (hardcoverTokenIssue) {
    throw new Error(
      "HARDCOVER_API_TOKEN is required. Set HARDCOVER_API_TOKEN in your environment so Obelus can access Hardcover API.",
    );
  }

  throw parsed.error;
}

const envValues = parsed.data;

const oauthFields = [
  ["OAUTH_ISSUER", envValues.OAUTH_ISSUER],
  ["OAUTH_JWKS_URL", envValues.OAUTH_JWKS_URL],
  ["OAUTH_CLIENT_ID", envValues.OAUTH_CLIENT_ID],
  ["OAUTH_CLIENT_SECRET", envValues.OAUTH_CLIENT_SECRET],
  ["OAUTH_AUTHORIZE_URL", envValues.OAUTH_AUTHORIZE_URL],
  ["OAUTH_TOKEN_URL", envValues.OAUTH_TOKEN_URL],
  ["OAUTH_USERINFO_URL", envValues.OAUTH_USERINFO_URL],
  ["OAUTH_REDIRECT_URI", envValues.OAUTH_REDIRECT_URI],
] as const;

const oauthConfigured = oauthFields.every(([, value]) => Boolean(value));
const oauthPartiallyConfigured =
  oauthFields.some(([, value]) => Boolean(value)) && !oauthConfigured;

if (oauthPartiallyConfigured) {
  const missingOauthFields = oauthFields
    .filter(([, value]) => !value)
    .map(([field]) => field)
    .join(", ");
  throw new Error(
    `OAuth/OIDC env is partially configured. Missing required values: ${missingOauthFields}. Set all required OAUTH_* values or leave all unset.`,
  );
}

if (envValues.NODE_ENV === "production") {
  if (envValues.SESSION_SECRET === "change-this-development-secret") {
    throw new Error("SESSION_SECRET must be set to a strong non-default value in production.");
  }
  if (envValues.DATABASE_URL === "postgres://postgres:postgres@localhost:5432/obelus") {
    throw new Error("DATABASE_URL must be explicitly set in production.");
  }
  if (envValues.HARDCOVER_API_TOKEN === "test-hardcover-token") {
    throw new Error("HARDCOVER_API_TOKEN must be explicitly set in production.");
  }
}

export const env = envValues;

export const isSsoEnabled = oauthConfigured;
