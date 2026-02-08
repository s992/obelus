import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./types.js";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const csrfProtected = t.middleware(({ ctx, next, type }) => {
  if (type === "mutation" && ctx.requestCsrfToken !== ctx.csrfToken) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Invalid CSRF token." });
  }
  return next();
});

export const csrfPublicProcedure = t.procedure.use(csrfProtected);
export const csrfProtectedProcedure = t.procedure.use(csrfProtected).use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
