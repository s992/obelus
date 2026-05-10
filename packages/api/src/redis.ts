import { createClient } from 'redis';

import { config } from './config';
import { logger } from './log';

export const client = createClient({ url: config.OBELUS_REDIS_URL });

client.connect().catch((err) => {
  logger.error(err);
  process.exit(1);
});
