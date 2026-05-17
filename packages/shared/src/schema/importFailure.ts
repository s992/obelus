import z from 'zod';

export const ImportFailureSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
});
