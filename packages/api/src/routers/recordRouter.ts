import {
  JudgmentEnumSchema,
  RecordJsonSchema,
  RecordSchema,
  RecordStatusEnumSchema,
  SortFieldSchema,
} from '@obelus/shared/schema';
import { TRPCError } from '@trpc/server';
import z from 'zod';

import { listUserRecords } from '../bookRecord/listUserRecords';
import { db } from '../db/db';
import { createRecord, deleteRecord, updateRecord } from '../sqlc/record_sql';
import { privateProcedure, router } from '../trpc/trpc';

export const recordRouter = router({
  list: privateProcedure
    .input(
      z.object({
        status: RecordStatusEnumSchema,
        judgment: JudgmentEnumSchema.nullable(),
        cursor: z.string().optional(),
        sortField: SortFieldSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return;
      }

      return listUserRecords(ctx.currentUser.id, input.cursor, input.sortField, input.status, input.judgment);
    }),
  create: privateProcedure.input(RecordSchema.pick({ bookId: true, status: true })).mutation(async ({ input, ctx }) => {
    if (!ctx.currentUser.id) {
      return;
    }

    const shouldDefaultStartedAt = input.status === 'reading' || input.status === 'finished';

    await createRecord(db, {
      bookid: input.bookId,
      finishedat: input.status === 'finished' ? new Date() : null,
      startedat: shouldDefaultStartedAt ? new Date() : null,
      status: input.status,
      userid: ctx.currentUser.id,
      judgment: null,
    });
  }),
  update: privateProcedure
    .input(
      RecordJsonSchema.omit({ bookId: true, createdAt: true, updatedAt: true }).extend({
        judgment: JudgmentEnumSchema.optional(),
        finishedAt: z.iso.datetime().optional(),
        startedAt: z.iso.datetime().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return;
      }

      const { id, ...params } = input;

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const start = params.startedAt ? new Date(params.startedAt) : null;
      const finish = params.finishedAt ? new Date(params.finishedAt) : null;

      await updateRecord(db, {
        id,
        finishedat: finish,
        judgment: params.judgment ?? null,
        startedat: start,
        status: params.status,
        userid: ctx.currentUser.id,
      });
    }),
  delete: privateProcedure.input(RecordSchema.pick({ id: true })).mutation(async ({ input, ctx }) => {
    if (!ctx.currentUser.id) {
      return;
    }

    await deleteRecord(db, { id: input.id, userid: ctx.currentUser.id });
  }),
});
