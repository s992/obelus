import type { FastifyReply, FastifyRequest } from "fastify";
import { resolveCurrentUser } from "./auth.js";
import { ensureCsrfToken } from "./csrf.js";
import { env } from "./env.js";
import type { Context } from "./types.js";

export const createContext = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<Context> => {
  const token = request.cookies[env.SESSION_COOKIE_NAME];
  const { user, sessionId } = await resolveCurrentUser(token);
  const csrfToken = ensureCsrfToken(request, reply);
  const requestCsrfToken =
    typeof request.headers["x-csrf-token"] === "string" ? request.headers["x-csrf-token"] : null;

  return {
    ip: request.ip,
    user,
    sessionId,
    csrfToken,
    requestCsrfToken,
    setCookie: (sessionToken: string) => {
      reply.setCookie(env.SESSION_COOKIE_NAME, sessionToken, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
    },
    clearCookie: () => {
      reply.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
    },
  };
};
