import { TRPCError } from '@trpc/server';
import z from 'zod';

import { UserSchema } from '@obelus/shared/schema';

import { hashPassword, verifyPassword } from '../auth/auth';
import { db } from '../db/db';
import { getUserById, updateUser } from '../sqlc/user_sql';
import { privateProcedure, router } from '../trpc/trpc';

export const userRouter = router({
  me: privateProcedure.query(async ({ ctx }) => {
    const user = await getUserById(db, { userid: ctx.currentUser.id });

    if (!user || user.status !== 'active') {
      return null;
    }

    return {
      id: user.id,
      userName: user.userName,
      public: user.public,
      role: user.role,
    };
  }),
  changePassword: privateProcedure
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().nonempty().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(db, { userid: ctx.currentUser.id });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const isValidPassword = await verifyPassword(user.passwordHash, input.currentPassword);

      if (!isValidPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const newPasswordHash = await hashPassword(input.newPassword);
      await updateUser(db, { passwordhash: newPasswordHash, public: null, userid: ctx.currentUser.id, status: null });
    }),
  update: privateProcedure.input(UserSchema.pick({ public: true })).mutation(async ({ ctx, input }) => {
    await updateUser(db, { public: input.public, passwordhash: null, userid: ctx.currentUser.id, status: null });
  }),
});
