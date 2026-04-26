import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env['DATABASE_URL']) {
  process.stderr.write('failed to initialize: DATABASE_URL is not defined');
  process.exit(1);
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
});
