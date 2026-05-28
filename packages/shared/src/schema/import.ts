import z from 'zod';

export const ImportProgressSchema = z.object({
  status: z.enum(['in-progress', 'complete']),
  total: z.number(),
  pending: z.number(),
  failedLookup: z.number(),
  failedInsert: z.number(),
  succeeded: z.number(),
});

export const ImportFailureReasonSchema = z.enum(['already_exists', 'cannot_find']);

export const ImportFailureSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  reason: ImportFailureReasonSchema,
});

export const ImportRecordSchema = z.object({
  createdAt: z.date(),
  completedAt: z.date().nullable().optional(),
  successCount: z.number(),
  failures: z.array(ImportFailureSchema),
});

export const ImportRecordJsonSchema = ImportRecordSchema.omit({ createdAt: true, completedAt: true }).extend({
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable().optional(),
});
