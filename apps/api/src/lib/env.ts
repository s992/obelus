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
  CSRF_COOKIE_NAME: z.string().default("obelus_csrf"),
  SESSION_SECRET: z.string().min(16).default("change-this-development-secret"),
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

const parsed = envSchema.parse(process.env);

const oauthFields = {
  issuer: parsed.OAUTH_ISSUER,
  jwksUrl: parsed.OAUTH_JWKS_URL,
  clientId: parsed.OAUTH_CLIENT_ID,
  clientSecret: parsed.OAUTH_CLIENT_SECRET,
  authorizeUrl: parsed.OAUTH_AUTHORIZE_URL,
  tokenUrl: parsed.OAUTH_TOKEN_URL,
  userInfoUrl: parsed.OAUTH_USERINFO_URL,
  redirectUri: parsed.OAUTH_REDIRECT_URI,
};

const oauthValues = Object.values(oauthFields);
const oauthConfigured = oauthValues.every((value) => Boolean(value));
const oauthPartiallyConfigured = oauthValues.some((value) => Boolean(value)) && !oauthConfigured;

if (oauthPartiallyConfigured) {
  throw new Error(
    "OAuth/OIDC env is partially configured. Set all required OAUTH_* values or leave all unset.",
  );
}

if (parsed.NODE_ENV === "production") {
  if (parsed.SESSION_SECRET === "change-this-development-secret") {
    throw new Error("SESSION_SECRET must be set to a strong non-default value in production.");
  }
  if (parsed.DATABASE_URL === "postgres://postgres:postgres@localhost:5432/obelus") {
    throw new Error("DATABASE_URL must be explicitly set in production.");
  }
}

export const env = parsed;

export const isSsoEnabled = oauthConfigured;
