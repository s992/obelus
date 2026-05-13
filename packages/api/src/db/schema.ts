import { boolean, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const judgmentEnum = pgEnum('judgment', ['accepted', 'rejected', 'mixed']);
export const recordStatusEnum = pgEnum('record_status', ['planned', 'reading', 'finished']);

export const userTable = pgTable('user', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userName: text().notNull().unique(),
  passwordHash: text().notNull(),
  public: boolean().notNull().default(false),
});

export const recordTable = pgTable(
  'record',
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    userId: uuid()
      .references(() => userTable.id)
      .notNull(),
    bookId: integer().notNull(),
    finishedAt: timestamp(),
    judgment: judgmentEnum(),
    startedAt: timestamp(),
    status: recordStatusEnum().notNull(),
  },
  (t) => [unique().on(t.userId, t.bookId)],
);

export const noteTable = pgTable('note', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  recordId: uuid()
    .references(() => recordTable.id)
    .notNull(),
  userId: uuid()
    .references(() => userTable.id)
    .notNull(),
  content: text().notNull(),
});
