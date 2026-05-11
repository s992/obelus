import { z } from 'zod';

import { book } from '../schema/book';

export type Book = z.infer<typeof book>;
