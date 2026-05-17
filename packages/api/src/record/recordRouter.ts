import {
  JudgmentEnumSchema,
  RecordJsonSchema,
  RecordSchema,
  RecordStatusEnumSchema,
  SortFieldSchema,
} from '@obelus/shared/schema';
import type { Maybe, SortField } from '@obelus/shared/types';
import { TRPCError } from '@trpc/server';
import z from 'zod';

import { collateRecordsAndBooks } from '../bookRecord/collateRecordsAndBooks';
import { db } from '../db/db';
import { client } from '../gql/client';
import { createRecord, type ListRecordsRow, listRecords, updateRecord } from '../sqlc/record_sql';
import { privateProcedure, router } from '../trpc/trpc';

const PAGE_SIZE = 20;

export const recordRouter = router({
  list: privateProcedure
    .input(
      z.object({
        status: RecordStatusEnumSchema,
        cursor: z.string().optional(),
        sortField: SortFieldSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return;
      }

      const records = await listRecords(db, {
        cursor: decodeCursor(input.cursor),
        pagesize: PAGE_SIZE + 1,
        status: input.status,
        userid: ctx.currentUser.id,
        sortfield: input.sortField,
      });

      const hasMore = records.length > PAGE_SIZE;

      if (hasMore) {
        records?.pop();
      }

      const bookIds = records.map((record) => record.bookId);
      const { books } = await client.GetBooksByIds({ ids: bookIds });

      return {
        books: collateRecordsAndBooks(z.array(RecordSchema).parse(records), books),
        hasNextPage: hasMore,
        nextPageToken: hasMore ? encodeCursor(records[records.length - 1], input.sortField) : null,
      };
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
});

function encodeCursor(row: Maybe<ListRecordsRow>, sortField: SortField) {
  if (!row) {
    return null;
  }

  let date: Date | null;

  switch (sortField) {
    case 'finished_at':
      date = row.finishedAt;
      break;
    case 'started_at':
      date = row.startedAt;
      break;
    default:
      date = row.updatedAt;
  }

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
