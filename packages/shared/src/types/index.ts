import { z } from 'zod';

import type {
  BookSchema,
  NoteJsonSchema,
  NoteSchema,
  RecordJsonSchema,
  RecordSchema,
  SeriesSchema,
  SortFieldSchema,
} from '../schema';

export type Book = z.infer<typeof BookSchema>;

export type Series = z.infer<typeof SeriesSchema>;

export type Note = z.infer<typeof NoteSchema>;

export type NoteJson = z.infer<typeof NoteJsonSchema>;

export type Record = z.infer<typeof RecordSchema>;

export type RecordJson = z.infer<typeof RecordJsonSchema>;

export type SortField = z.infer<typeof SortFieldSchema>;

export type Status = 'planned' | 'finished' | 'reading';

export type Judgment = 'accepted' | 'rejected' | 'mixed';

export type Maybe<T> = T | undefined | null;
