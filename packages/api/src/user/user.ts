import { eq } from 'drizzle-orm';

import { db } from '../db/db';
import { userTable } from '../db/schema';

export async function getUserByUserName(userName: string) {
  const [user] = await db.select().from(userTable).where(eq(userTable.userName, userName)).limit(1);

  return user;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);

  return user;
}

export function createUser(user: typeof userTable.$inferInsert) {
  return db.insert(userTable).values(user).returning();
}
