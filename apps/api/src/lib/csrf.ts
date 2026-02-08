import { randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "./env.js";

const CSRF_TOKEN_BYTES = 32;

const buildCookieOptions = () => ({
  path: "/",
  sameSite: "lax" as const,
  httpOnly: false,
  secure: env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
});

export const ensureCsrfToken = (request: FastifyRequest, reply: FastifyReply): string => {
  const existing = request.cookies[env.CSRF_COOKIE_NAME];
  if (existing && existing.length > 0) {
    return existing;
  }

  const token = randomBytes(CSRF_TOKEN_BYTES).toString("base64url");
  reply.setCookie(env.CSRF_COOKIE_NAME, token, buildCookieOptions());
  return token;
};

export const clearCsrfToken = (reply: FastifyReply) => {
  reply.clearCookie(env.CSRF_COOKIE_NAME, { path: "/" });
};
