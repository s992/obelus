import { TRPCError } from '@trpc/server';
import z from 'zod';

import { db } from '../db/db';
import { getUserPublicProfile } from '../sqlc/user_sql';
import { publicProcedure, router } from '../trpc/trpc';

export const publicRecordRouter = router({
  profile: publicProcedure.input(z.object({ userName: z.string() })).query(async ({ input, ctx }) => {
    const user = await getUserPublicProfile(db, { username: input.userName });

    if (!user?.public && user?.id !== ctx.currentUser.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return user;
  }),
});
