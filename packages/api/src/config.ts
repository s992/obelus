import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().nonempty(),
  HARDCOVER_API_TOKEN: z.string().nonempty(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const error = JSON.stringify(z.treeifyError(parsed.error), null, 2);
  console.error(`failed to initialize due to invalid env variables: ${error}`);
  process.exit(1);
}

export const config = parsed.data;
