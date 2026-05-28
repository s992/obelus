import { TRPCError } from '@trpc/server';
import z from 'zod';

import { ListUsersSchema, UserRoleSchema, UserSchema, UserStatusSchema } from '@obelus/shared/schema';

import { hashPassword, verifyPassword } from '../auth/auth';
import { db } from '../db/db';
import { paginate } from '../pagination/paginate';
import { getUserById, listUsers, updateUser } from '../sqlc/user_sql';
import { adminProcedure, privateProcedure, router } from '../trpc/trpc';

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
      await updateUser(db, {
        passwordhash: newPasswordHash,
        public: null,
        userid: ctx.currentUser.id,
        status: null,
        role: null,
      });
    }),
  update: privateProcedure.input(UserSchema.pick({ public: true })).mutation(async ({ ctx, input }) => {
    await updateUser(db, {
      public: input.public,
      passwordhash: null,
      userid: ctx.currentUser.id,
      status: null,
      role: null,
    });
  }),
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        status: UserStatusSchema.nullable(),
        role: UserRoleSchema.nullable(),
      }),
    )
    .output(ListUsersSchema)
    .query(async ({ input }) => {
      const { records, ...rest } = await paginate({
        queryFn: ({ cursor, pageSize }) =>
          listUsers(db, {
            cursor,
            pagesize: pageSize,
            role: input.role,
            status: input.status,
          }),
        currentCursor: input.cursor,
        getCount: (row) => parseInt(row.totalCount),
        getNextCursor: (row) => row.userName,
        pageSize: 25,
      });

      return ListUsersSchema.parse({ users: records, ...rest });
    }),
  adminUpdateUser: adminProcedure
    .input(UserSchema.pick({ id: true, role: true, status: true }))
    .mutation(async ({ input }) => {
      await updateUser(db, {
        passwordhash: null,
        public: null,
        role: input.role,
        status: input.status,
        userid: input.id,
      });
    }),
});
