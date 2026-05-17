import type { ConnectionOptions } from 'bullmq';

import { config } from '../config';

export const connection = {
  url: config.OBELUS_REDIS_URL,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
} satisfies ConnectionOptions;
