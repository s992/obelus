import z from 'zod';

export const CsvRowSchema = z.object({
  id: z.coerce.number(),
  title: z.string().optional(),
  author: z.string().optional(),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  rating: z.coerce.number().optional(),
  added: z.string().optional(),
  finished: z.string().optional(),
  shelf: z.string().optional(),
});

export type TCsvRowSchema = z.infer<typeof CsvRowSchema>;

export const ProgressSchema = z.object({
  total: z.number(),
  pending: z.number(),
  failedLookup: z.number(),
  failedInsert: z.number(),
  succeeded: z.number(),
});
