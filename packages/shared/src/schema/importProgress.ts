import z from 'zod';

export const ImportProgressSchema = z.object({
  total: z.number(),
  pending: z.number(),
  failedLookup: z.number(),
  failedInsert: z.number(),
  succeeded: z.number(),
});
