import dotenv from 'dotenv';
import path from 'node:path';

import { EnvSchema } from '@obelus/shared/schema';

if (process.env['NODE_ENV'] !== 'production') {
  dotenv.config({ path: path.resolve('../../.env') });
}

export const config = EnvSchema.parse(process.env);
