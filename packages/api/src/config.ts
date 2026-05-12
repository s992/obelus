import path from 'node:path';
import { env } from '@obelus/shared/schema';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('../../.env') });

// SAFE_ENV is a hack to make knip play nice when we fail to parse the config
export const config = process.env['SAFE_ENV'] ? env.safeParse(process.env) : env.parse(process.env);
