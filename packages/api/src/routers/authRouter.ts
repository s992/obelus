import { TRPCError } from '@trpc/server';
import z from 'zod';

import { login, register } from '../auth/auth';
import { COOKIE_OPTS, JWT_OPTS } from '../auth/opts';
import { publicProcedure, rateLimitedPublicProcedure, router } from '../trpc/trpc';

export const authRouter = router({
  register: rateLimitedPublicProcedure
    .input(z.object({ userName: z.string().nonempty(), password: z.string().nonempty().min(8) }))
    .mutation(async ({ input, ctx }) => {
      const userId = await register(input.userName, input.password);

      if (!userId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: userId }, JWT_OPTS), COOKIE_OPTS);
    }),
  login: rateLimitedPublicProcedure
    .input(z.object({ userName: z.string().nonempty(), password: z.string().nonempty() }))
    .mutation(async ({ input, ctx }) => {
      const user = await login(input.userName, input.password);
      ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: user.id }, JWT_OPTS), COOKIE_OPTS);
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('token', COOKIE_OPTS);
  }),
});
