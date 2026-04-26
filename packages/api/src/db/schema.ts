import { bigint, boolean, decimal, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { bytea } from './bytea';

export const judgmentEnum = pgEnum('judgment', ['accepted', 'rejected', 'mixed']);
export const bookRecordStatusEnum = pgEnum('book_record_status', ['planned', 'reading', 'finished']);

export const userTable = pgTable('user', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  displayName: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  public: boolean().notNull().default(false),
});

export const seriesTable = pgTable('series', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  externalId: bigint({ mode: 'bigint' }).notNull(),
  count: bigint({ mode: 'bigint' }).notNull(),
  description: text(),
  name: text().notNull(),
});

export const bookTable = pgTable('book', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  externalId: bigint({ mode: 'bigint' }).notNull(),
  seriesId: uuid().references(() => seriesTable.id),
  author: text().notNull(),
  cover: bytea(),
  description: text(),
  pages: bigint({ mode: 'bigint' }),
  releaseDate: timestamp(),
  seriesPosition: decimal(),
  subTitle: text(),
  title: text().notNull(),
});

export const bookRecordTable = pgTable('book_record', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  bookId: uuid().references(() => bookTable.id),
  userId: uuid().references(() => userTable.id),
  finishedAt: timestamp(),
  judgment: judgmentEnum(),
  startedAt: timestamp(),
  status: bookRecordStatusEnum().notNull(),
});

export const noteTable = pgTable('note', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  bookId: uuid().references(() => bookTable.id),
  userId: uuid().references(() => userTable.id),
  content: text().notNull(),
});
