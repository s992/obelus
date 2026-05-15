import z from 'zod';

export const NoteSchema = z.object({
  id: z.uuidv4(),
  content: z.string(),
  createdAt: z.date(),
});

export const NoteJsonSchema = NoteSchema.omit({ createdAt: true }).extend({ createdAt: z.iso.datetime() });
