import z from 'zod';

import { JudgmentEnumSchema, RecordStatusEnumSchema } from './enum';

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
