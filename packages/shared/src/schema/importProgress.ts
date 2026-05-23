import z from 'zod';

export const ImportProgressSchema = z.object({
  status: z.enum(['in-progress', 'complete']),
  total: z.number(),
  pending: z.number(),
  failedLookup: z.number(),
  failedInsert: z.number(),
  succeeded: z.number(),
});
