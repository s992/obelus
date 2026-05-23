import { Pool } from 'pg';

import { config } from '../config';

export const db = new Pool({ connectionString: config.OBELUS_DATABASE_URL, max: 10 });
