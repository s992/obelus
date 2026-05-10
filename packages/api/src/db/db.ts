import { drizzle } from 'drizzle-orm/node-postgres';

import { config } from '../config';

export const db = drizzle(config.OBELUS_DATABASE_URL);
