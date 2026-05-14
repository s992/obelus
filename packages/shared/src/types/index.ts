import { z } from 'zod';

import type { book, note, series } from '../schema';

export type Book = z.infer<typeof book>;

export type Series = z.infer<typeof series>;

export type Note = z.infer<typeof note>;

export type Status = 'planned' | 'finished' | 'reading';

export type Judgment = 'accepted' | 'rejected' | 'mixed';

export type Maybe<T> = T | undefined | null;
