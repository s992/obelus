import { TRPCError } from '@trpc/server';
import z from 'zod';

import type { UserStatus } from '@obelus/shared/types';

import { login, register } from '../auth/auth';
import { COOKIE_OPTS, JWT_OPTS } from '../auth/opts';
import { db } from '../db/db';
import { ObelusConfigSchema, RegistrationStrategySchema } from '../schema';
import { getConfig } from '../sqlc/config_sql';
import { getInviteLink, type GetInviteLinkRow } from '../sqlc/invite_link_sql';
import { publicProcedure, rateLimitedPublicProcedure, router } from '../trpc/trpc';

const defaultStatus: Record<z.infer<typeof RegistrationStrategySchema>, UserStatus> = {
  closed: 'disabled',
  invite_link: 'active',
  open: 'active',
  requires_approval: 'pending_approval',
};

export const authRouter = router({
  register: rateLimitedPublicProcedure
    .input(
      z.object({
        userName: z.string().nonempty(),
        password: z.string().nonempty().min(8),
        inviteToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const sqlConfig = await getConfig(db);
      const config = ObelusConfigSchema.parse(sqlConfig);

      if (config.registrationStrategy === 'closed') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      let inviteLink: GetInviteLinkRow | null = null;

      if (config.registrationStrategy === 'invite_link') {
        if (!input.inviteToken) {
          throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT' });
        }

        inviteLink = await getInviteLink(db, { token: input.inviteToken });

        if (!inviteLink || inviteLink.usedAt || inviteLink.expiresAt < new Date()) {
          throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT' });
        }
      }

      const user = await register(
        input.userName,
        input.password,
        defaultStatus[config.registrationStrategy],
        inviteLink,
      );

      if (!user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      if (user.status === 'active') {
        ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: user.id }, JWT_OPTS), COOKIE_OPTS);
      }

      return user;
    }),
  login: rateLimitedPublicProcedure
    .input(z.object({ userName: z.string().nonempty(), password: z.string().nonempty() }))
    .mutation(async ({ input, ctx }) => {
      const user = await login(input.userName, input.password);

      if (user.status !== 'active') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      ctx.res.cookie('token', ctx.req.server.jwt.sign({ id: user.id }, JWT_OPTS), COOKIE_OPTS);
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('token', COOKIE_OPTS);
  }),
});
