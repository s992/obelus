import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { TRPCError } from "@trpc/server";
import { env, isSsoEnabled } from "./env.js";

const OAUTH_TXN_TTL_MS = 10 * 60 * 1000;

const randomBase64Url = (bytes: number): string => {
  return randomBytes(bytes).toString("base64url");
};

const sha256Base64Url = (value: string): string => {
  return createHash("sha256").update(value).digest("base64url");
};

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `SSO upstream request failed with status ${response.status}.`,
      });
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const assertSsoEnabled = () => {
  if (!isSsoEnabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "OAuth2/OIDC is not configured in environment variables.",
    });
  }
};

export const createSsoBeginPayload = () => {
  assertSsoEnabled();

  const state = randomBase64Url(24);
  const nonce = randomBase64Url(24);
  const codeVerifier = randomBase64Url(48);
  const codeChallenge = sha256Base64Url(codeVerifier);

  const authorizeUrl = new URL(env.OAUTH_AUTHORIZE_URL!);
  authorizeUrl.searchParams.set("client_id", env.OAUTH_CLIENT_ID!);
  authorizeUrl.searchParams.set("redirect_uri", env.OAUTH_REDIRECT_URI!);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", env.OAUTH_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return {
    state,
    nonce,
    codeVerifier,
    expiresAt: new Date(Date.now() + OAUTH_TXN_TTL_MS),
    authorizeUrl: authorizeUrl.toString(),
  };
};

type TokenResponse = {
  access_token?: string;
  id_token?: string;
};

type UserInfoResponse = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
};

export const resolveSsoIdentity = async (input: {
  code: string;
  codeVerifier: string;
  nonce: string;
}) => {
  assertSsoEnabled();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: env.OAUTH_REDIRECT_URI!,
    client_id: env.OAUTH_CLIENT_ID!,
    client_secret: env.OAUTH_CLIENT_SECRET!,
    code_verifier: input.codeVerifier,
  });

  const tokenPayload = await fetchJson<TokenResponse>(env.OAUTH_TOKEN_URL!, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenPayload.access_token || !tokenPayload.id_token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "SSO token response was missing required fields.",
    });
  }

  const jwks = createRemoteJWKSet(new URL(env.OAUTH_JWKS_URL!));
  const { payload } = await jwtVerify(tokenPayload.id_token, jwks, {
    issuer: env.OAUTH_ISSUER!,
    audience: env.OAUTH_CLIENT_ID!,
  });

  if (payload.nonce !== input.nonce) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Invalid SSO nonce." });
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "SSO subject is missing." });
  }

  let email = typeof payload.email === "string" ? payload.email : undefined;
  let name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : undefined;

  if (!email || !name) {
    const userInfo = await fetchJson<UserInfoResponse>(env.OAUTH_USERINFO_URL!, {
      headers: { authorization: `Bearer ${tokenPayload.access_token}` },
    });
    email = email ?? userInfo.email;
    name = name ?? userInfo.name ?? userInfo.preferred_username;
    if (!userInfo.sub || userInfo.sub !== payload.sub) {
      throw new TRPCError({ code: "FORBIDDEN", message: "SSO subject mismatch." });
    }
  }

  if (!email) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "SSO provider did not return email." });
  }

  return {
    provider: env.OAUTH_PROVIDER,
    providerSubject: payload.sub,
    email,
    displayName: name ?? email,
  };
};
