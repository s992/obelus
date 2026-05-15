import { z } from 'zod';

export const SeriesSchema = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
  position: z.number().nullable(),
  bookCount: z.number().nullable(),
});
