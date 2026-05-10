import { CookieSerializeOptions } from '@fastify/cookie';
import { SignOptions } from '@fastify/jwt';
import { TRPCError } from '@trpc/server';
import z from 'zod';

import { publicProcedure, router } from '../trpc/trpc';
import { login, register } from './auth';

const JWT_OPTS = { expiresIn: '30d' } satisfies Partial<SignOptions>;
// TODO: env vars for secure and domain
const COOKIE_OPTS = {
  domain: 'localhost',
  path: '/',
  sameSite: true,
  secure: false,
  signed: true,
} satisfies CookieSerializeOptions;

export const authRouter = router({
  register: publicProcedure
    .input(z.object({ userName: z.string().nonempty(), password: z.string().nonempty() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await register(input.userName, input.password);

      if (!user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: user.id }, JWT_OPTS), COOKIE_OPTS);
    }),
  login: publicProcedure
    .input(z.object({ userName: z.string().nonempty(), password: z.string().nonempty() }))
    .mutation(async ({ input, ctx }) => {
      const user = await login(input.userName, input.password);
      ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: user.id }, JWT_OPTS), COOKIE_OPTS);
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('token', COOKIE_OPTS);
  }),
});
