import { TRPCError } from '@trpc/server';

import { privateProcedure, router } from '../trpc/trpc';
import { getUserById } from './user';

export const userRouter = router({
  me: privateProcedure.query(({ ctx }) => {
    if (!ctx.currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return getUserById(ctx.currentUser.id);
  }),
});
