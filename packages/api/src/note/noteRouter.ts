import { note } from '@obelus/shared/schema';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

import { db } from '../db/db';
import { noteTable } from '../db/schema';
import { privateProcedure, router } from '../trpc/trpc';

const noteSchema = createInsertSchema(noteTable);

export const noteRouter = router({
  create: privateProcedure
    .input(noteSchema.pick({ recordId: true, content: true }))
    .output(note)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const [note] = await db
        .insert(noteTable)
        .values({
          ...input,
          userId: ctx.currentUser.id,
        })
        .returning();

      if (!note) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return {
        id: note.id,
        createdAt: note.createdAt.toISOString(),
        content: note.content,
      };
    }),
  list: privateProcedure
    .input(noteSchema.pick({ recordId: true }))
    .output(z.array(note))
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const notes = await db
        .select({
          id: noteTable.id,
          createdAt: noteTable.createdAt,
          content: noteTable.content,
        })
        .from(noteTable)
        .where(and(eq(noteTable.recordId, input.recordId), eq(noteTable.userId, ctx.currentUser.id)))
        .orderBy(desc(noteTable.createdAt));

      return notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
      }));
    }),
});
