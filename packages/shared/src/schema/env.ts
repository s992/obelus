import type { LevelWithSilent } from 'pino';
import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] satisfies LevelWithSilent[];

export const env = z.object({
  OBELUS_API_PORT: z.coerce.number().default(3000),
  OBELUS_AUTH_TOKEN_SECRET: z.string().nonempty(),
  OBELUS_BASE_URL: z.string().nonempty(),
  OBELUS_CLIENT_PORT: z.coerce.number().default(5173),
  OBELUS_COOKIE_SECRET: z.string().nonempty(),
  OBELUS_DATABASE_URL: z.string().nonempty(),
  OBELUS_HARDCOVER_API_TOKEN: z.string().nonempty(),
  OBELUS_LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
});
