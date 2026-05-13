import z from 'zod';

export const record = z.object({
  id: z.uuidv4(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  bookId: z.number(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  judgment: z.enum(['accepted', 'mixed', 'rejected']).nullable(),
  status: z.enum(['planned', 'finished', 'reading']),
});
