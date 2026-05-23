import { initTRPC, TRPCError } from '@trpc/server';

import { checkRateLimit } from '../server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;
export const router = t.router;

export const privateProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.currentUser.isAuthenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx });
});

export const rateLimitedPublicProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const rateLimit = await checkRateLimit(ctx.req);

  if (!rateLimit.isAllowed && rateLimit.isExceeded) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  }

  return next();
});
