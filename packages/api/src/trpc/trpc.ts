import { initTRPC, TRPCError } from '@trpc/server';

import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;
export const router = t.router;

export const privateProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.currentUser.isAuthenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx });
});
