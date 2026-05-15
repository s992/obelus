import { Client } from 'pg';

import { config } from '../config';

export const db = new Client({ connectionString: config.OBELUS_DATABASE_URL });

db.connect();
