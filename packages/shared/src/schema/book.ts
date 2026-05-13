import { z } from 'zod';

import { record } from './record';
import { series } from './series';

export const book = z.object({
  id: z.number(),
  author: z.string().nullable(),
  coverImage: z.string().nullable(),
  description: z.string().nullable(),
  pages: z.number().nullable(),
  releaseDate: z.string().nullable(),
  series: series.nullable(),
  subTitle: z.string().nullable(),
  title: z.string().nullable(),
  record: record.nullable(),
});
