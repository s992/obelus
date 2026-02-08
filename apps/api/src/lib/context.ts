import type { FastifyReply, FastifyRequest } from "fastify";
import { resolveCurrentUser } from "./auth.js";
import { env } from "./env.js";
import type { Context } from "./types.js";

export const createContext = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<Context> => {
  const token = request.cookies[env.SESSION_COOKIE_NAME];
  const user = await resolveCurrentUser(token);

  return {
    user,
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
