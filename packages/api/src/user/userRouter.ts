import { TRPCError } from '@trpc/server';

import { db } from '../db/db';
import { getUserById } from '../sqlc/user_sql';
import { privateProcedure, router } from '../trpc/trpc';

export const userRouter = router({
  me: privateProcedure.query(({ ctx }) => {
    if (!ctx.currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return getUserById(db, { userid: ctx.currentUser.id });
  }),
});
