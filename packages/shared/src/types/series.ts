import type z from 'zod';

import type { series } from '../schema';

export type Series = z.infer<typeof series>;
