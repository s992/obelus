import pino from 'pino';

import { config } from './config';

export const logger = pino({
  level: config.OBELUS_LOG_LEVEL,
  ...(process.env['NODE_ENV'] !== 'production' && {
    transport: {
      target: 'pino-pretty',
    },
  }),
});
