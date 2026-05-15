import { z } from 'zod';

import { RecordJsonSchema } from './record';
import { SeriesSchema } from './series';

export const BookSchema = z.object({
  id: z.number(),
  author: z.string().nullable(),
  coverImage: z.string().nullable(),
  description: z.string().nullable(),
  pages: z.number().nullable(),
  releaseDate: z.string().nullable(),
  series: SeriesSchema.nullable(),
  subTitle: z.string().nullable(),
  title: z.string().nullable(),
  record: RecordJsonSchema.nullable(),
});
