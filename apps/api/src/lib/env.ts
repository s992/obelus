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
  TRUST_PROXY: z.coerce.boolean().default(false),
  APP_ORIGIN: z.string().default("http://localhost:5173"),
  APP_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/obelus"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_COOKIE_NAME: z.string().default("obelus_session"),
  CSRF_COOKIE_NAME: z.string().default("obelus_csrf"),
  SESSION_SECRET: z.string().min(16).default("change-this-development-secret"),
  OPENLIBRARY_CONTACT_EMAIL: z.string().email(),
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
  const openLibraryContactIssue = parsed.error.issues.find(
    (issue) => issue.path[0] === "OPENLIBRARY_CONTACT_EMAIL",
  );

  if (openLibraryContactIssue) {
    throw new Error(
      "OPENLIBRARY_CONTACT_EMAIL is required and must be a valid email address. " +
        "Set OPENLIBRARY_CONTACT_EMAIL in your environment so Obelus can identify itself to the OpenLibrary API.",
    );
  }

  throw parsed.error;
}

const envValues = parsed.data;

const oauthFields = {
  issuer: envValues.OAUTH_ISSUER,
  jwksUrl: envValues.OAUTH_JWKS_URL,
  clientId: envValues.OAUTH_CLIENT_ID,
  clientSecret: envValues.OAUTH_CLIENT_SECRET,
  authorizeUrl: envValues.OAUTH_AUTHORIZE_URL,
  tokenUrl: envValues.OAUTH_TOKEN_URL,
  userInfoUrl: envValues.OAUTH_USERINFO_URL,
  redirectUri: envValues.OAUTH_REDIRECT_URI,
};

const oauthValues = Object.values(oauthFields);
const oauthConfigured = oauthValues.every((value) => Boolean(value));
const oauthPartiallyConfigured = oauthValues.some((value) => Boolean(value)) && !oauthConfigured;

if (oauthPartiallyConfigured) {
  throw new Error(
    "OAuth/OIDC env is partially configured. Set all required OAUTH_* values or leave all unset.",
  );
}

if (envValues.NODE_ENV === "production") {
  if (envValues.SESSION_SECRET === "change-this-development-secret") {
    throw new Error("SESSION_SECRET must be set to a strong non-default value in production.");
  }
  if (envValues.DATABASE_URL === "postgres://postgres:postgres@localhost:5432/obelus") {
    throw new Error("DATABASE_URL must be explicitly set in production.");
  }
}

export const env = envValues;

export const isSsoEnabled = oauthConfigured;
