import { TRPCError } from '@trpc/server';
import z from 'zod';

import { RecordStatusEnumSchema, RecordSortFieldSchema } from '@obelus/shared/schema';

import { listUserRecords } from '../bookRecord/listUserRecords';
import { db } from '../db/db';
import { getUserPublicProfile } from '../sqlc/user_sql';
import { publicProcedure, router } from '../trpc/trpc';

export const publicRecordRouter = router({
  profile: publicProcedure.input(z.object({ userName: z.string() })).query(async ({ input, ctx }) => {
    const user = await getUserPublicProfile(db, { username: input.userName });
    const exists = !!user;
    const isPublic = user?.public;
    const isCurrentUser = ctx.currentUser.isAuthenticated && user?.id === ctx.currentUser.id;

    if (!exists || (!isPublic && !isCurrentUser)) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return user;
  }),
  records: publicProcedure
    .input(
      z.object({
        userName: z.string(),
        status: RecordStatusEnumSchema,
        cursor: z.string().optional(),
        sortField: RecordSortFieldSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await getUserPublicProfile(db, { username: input.userName });
      const isCurrentUser = ctx.currentUser.isAuthenticated && user?.id === ctx.currentUser.id;

      if (!user || (!user.public && !isCurrentUser)) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return listUserRecords(user.id, input.cursor, input.sortField, input.status, null);
    }),
});
