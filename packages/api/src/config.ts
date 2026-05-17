import path from 'node:path';
import { env } from '@obelus/shared/schema';
import dotenv from 'dotenv';

if (process.env['NODE_ENV'] !== 'production') {
  dotenv.config({ path: path.resolve('../../.env') });
}

export const config = env.parse(process.env);
