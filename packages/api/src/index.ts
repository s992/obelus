import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

import { userTable } from './db/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  await db.insert(userTable).values({
    displayName: 'sean',
    email: 'sean@walsh.place',
    passwordHash: 'asdf',
  });

  console.log('created');

  const users = await db.select().from(userTable);
  console.log('users', JSON.stringify(users, null, 2));

  await db.update(userTable).set({ passwordHash: 'fdsa', public: true });

  const users2 = await db.select().from(userTable);
  console.log('users', JSON.stringify(users2, null, 2));

  await db.delete(userTable);

  const users3 = await db.select().from(userTable);
  console.log('users', JSON.stringify(users3, null, 2));
}

main();
