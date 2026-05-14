import { z } from 'zod';

export const note = z.object({
  id: z.uuidv4(),
  createdAt: z.iso.datetime(),
  content: z.string(),
});
