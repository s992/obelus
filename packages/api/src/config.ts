import dotenv from 'dotenv';
import { LevelWithSilent } from 'pino';
import { z } from 'zod';

dotenv.config();

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] satisfies LevelWithSilent[];

const schema = z.object({
  AUTH_TOKEN_SECRET: z.string().nonempty(),
  COOKIE_SECRET: z.string().nonempty(),
  DATABASE_URL: z.string().nonempty(),
  HARDCOVER_API_TOKEN: z.string().nonempty(),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  PORT: z.coerce.number().default(3000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const error = JSON.stringify(z.treeifyError(parsed.error), null, 2);
  console.error(`failed to initialize due to invalid env variables: ${error}`);
  process.exit(1);
}

export const config = parsed.data;
