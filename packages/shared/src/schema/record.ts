import z from 'zod';

export const record = z.object({
  id: z.uuidv4(),
  createdAt: z.date(),
  updatedAt: z.date(),
  bookId: z.number(),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  judgment: z.enum(['accepted', 'mixed', 'rejected']).nullable(),
  status: z.enum(['planned', 'finished', 'reading']),
});
