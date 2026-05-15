import { NoteJsonSchema } from '@obelus/shared/schema';
import z from 'zod';

import { db } from '../db/db';
import { createNote, listNotes } from '../sqlc/note_sql';
import { privateProcedure, router } from '../trpc/trpc';

export const noteRouter = router({
  create: privateProcedure.input(NoteJsonSchema.pick({ id: true, content: true })).mutation(async ({ input, ctx }) => {
    if (!ctx.currentUser.id) {
      return;
    }

    await createNote(db, { content: input.content, recordid: input.id, userid: ctx.currentUser.id });
  }),
  list: privateProcedure
    .input(NoteJsonSchema.pick({ id: true }))
    .output(z.array(NoteJsonSchema).nullable())
    .query(async ({ input, ctx }) => {
      if (!ctx.currentUser.id) {
        return null;
      }

      const notes = await listNotes(db, { userid: ctx.currentUser.id, recordid: input.id });

      return notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
      }));
    }),
});
