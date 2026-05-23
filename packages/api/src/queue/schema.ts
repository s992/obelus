import z from 'zod';

export const CsvRowSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  author: z.string().optional(),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  rating: z.coerce.number().optional(),
  added: z.string().optional(),
  finished: z.string().optional(),
  shelf: z.string().optional(),
});

export type CsvRow = z.infer<typeof CsvRowSchema>;
