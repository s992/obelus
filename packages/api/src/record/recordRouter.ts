import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

import { db } from '../db/db';
import { recordTable } from '../db/schema';
import { privateProcedure, router } from '../trpc/trpc';

const recordSchema = createInsertSchema(recordTable);

export const recordRouter = router({
  create: privateProcedure.input(recordSchema.pick({ bookId: true, status: true })).mutation(async ({ input, ctx }) => {
    const shouldDefaultStartedAt = input.status === 'reading' || input.status === 'finished';

    if (!ctx.currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const record = await db
      .insert(recordTable)
      .values({
        bookId: input.bookId,
        status: input.status,
        userId: ctx.currentUser.id,
        startedAt: shouldDefaultStartedAt ? new Date() : undefined,
        finishedAt: input.status === 'finished' ? new Date() : undefined,
      })
      .returning();

    return record;
  }),
  update: privateProcedure
    .input(recordSchema.omit({ bookId: true, createdAt: true, updatedAt: true, userId: true }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...params } = input;

      if (!ctx.currentUser.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const record = await db
        .update(recordTable)
        .set(params)
        .where(and(eq(recordTable.id, id), eq(recordTable.userId, ctx.currentUser.id)))
        .returning();

      return record;
    }),
});
