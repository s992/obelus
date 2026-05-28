import z from 'zod';

export const JudgmentEnumSchema = z.enum(['accepted', 'rejected', 'mixed']);

export const RecordStatusEnumSchema = z.enum(['planned', 'reading', 'finished']);

export const RecordSortFieldSchema = z.enum(['started_at', 'finished_at', 'last_activity']);

export const RecordSchema = z.object({
  id: z.uuidv4(),
  bookId: z.number(),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  judgment: JudgmentEnumSchema.nullable(),
  status: RecordStatusEnumSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RecordJsonSchema = RecordSchema.omit({
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
