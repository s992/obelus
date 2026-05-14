import type { Maybe } from '@obelus/shared/types';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, lt } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

import { collateRecordsAndBooks } from '../bookRecord/collateRecordsAndBooks';
import { db } from '../db/db';
import { recordStatusEnum, recordTable } from '../db/schema';
import { client } from '../gql/client';
import { privateProcedure, router } from '../trpc/trpc';

const recordSchema = createInsertSchema(recordTable);
const PAGE_SIZE = 20;

export const recordRouter = router({
  list: privateProcedure
    .input(z.object({ status: z.enum(recordStatusEnum.enumValues), cursor: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const cursor = decodeCursor(input.cursor);
      const eqCurrentUser = eq(recordTable.userId, ctx.currentUser.id);
      const cursorCondition = cursor ? and(eqCurrentUser, lt(recordTable.updatedAt, cursor)) : eqCurrentUser;

      const records = await db
        .select()
        .from(recordTable)
        .where(and(cursorCondition, eq(recordTable.status, input.status)))
        .orderBy(desc(recordTable.updatedAt))
        .limit(PAGE_SIZE + 1);
      const hasMore = records.length > PAGE_SIZE;

      if (hasMore) {
        records?.pop();
      }

      const bookIds = records.map((record) => record.bookId);
      const { books } = await client.GetBooksByIds({ ids: bookIds });

      return {
        books: collateRecordsAndBooks(records, books),
        hasNextPage: hasMore,
        nextPageToken: hasMore ? encodeCursor(records[records.length - 1]?.updatedAt) : null,
      };
    }),
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

function encodeCursor(date: Maybe<Date>) {
  if (!date) {
    return null;
  }

  return Buffer.from(date.toISOString()).toString('base64url');
}

function decodeCursor(cursor: Maybe<string>) {
  if (!cursor) {
    return null;
  }

  return new Date(Buffer.from(cursor, 'base64url').toString());
}
