import {
  addToReadInputSchema,
  updateProfileInputSchema,
  upsertReadingEntryInputSchema,
} from "@obelus/shared";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { readingEntries, toReadEntries, users } from "../db/schema.js";
import {
  csrfProtectedProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../lib/trpc.js";

export const libraryRouter = router({
  listReading: protectedProcedure.query(async ({ ctx }) => {
    const entries = await db
      .select()
      .from(readingEntries)
      .where(eq(readingEntries.userId, ctx.user.id))
      .orderBy(desc(readingEntries.updatedAt));

    return entries.map((entry) => ({
      id: entry.id,
      bookKey: entry.bookKey,
      startedAt: entry.startedAt.toISOString(),
      finishedAt: entry.finishedAt ? entry.finishedAt.toISOString() : null,
      progressPercent: entry.progressPercent,
      judgment: entry.judgment,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));
  }),

  upsertReading: csrfProtectedProcedure
    .input(upsertReadingEntryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(readingEntries)
        .where(
          and(eq(readingEntries.userId, ctx.user.id), eq(readingEntries.bookKey, input.bookKey)),
        )
        .limit(1);

      if (existing[0]) {
        const [updated] = await db
          .update(readingEntries)
          .set({
            startedAt: new Date(input.startedAt),
            finishedAt: input.finishedAt ? new Date(input.finishedAt) : null,
            progressPercent: input.progressPercent,
            judgment: input.judgment,
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(readingEntries.id, existing[0].id))
          .returning();
        if (!updated) {
          throw new Error("Failed to update reading entry.");
        }

        return { id: updated.id };
      }

      const [created] = await db
        .insert(readingEntries)
        .values({
          userId: ctx.user.id,
          bookKey: input.bookKey,
          startedAt: new Date(input.startedAt),
          finishedAt: input.finishedAt ? new Date(input.finishedAt) : null,
          progressPercent: input.progressPercent,
          judgment: input.judgment,
          notes: input.notes,
        })
        .returning();
      if (!created) {
        throw new Error("Failed to create reading entry.");
      }

      return { id: created.id };
    }),

  removeReading: csrfProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(readingEntries)
        .where(and(eq(readingEntries.id, input.id), eq(readingEntries.userId, ctx.user.id)));
      return { ok: true };
    }),

  listToRead: protectedProcedure.query(async ({ ctx }) => {
    const entries = await db
      .select()
      .from(toReadEntries)
      .where(eq(toReadEntries.userId, ctx.user.id))
      .orderBy(desc(toReadEntries.addedAt));

    return entries.map((entry) => ({
      id: entry.id,
      bookKey: entry.bookKey,
      addedAt: entry.addedAt.toISOString(),
      priority: entry.priority,
      notes: entry.notes,
    }));
  }),

  addToRead: csrfProtectedProcedure.input(addToReadInputSchema).mutation(async ({ ctx, input }) => {
    const [entry] = await db
      .insert(toReadEntries)
      .values({
        userId: ctx.user.id,
        bookKey: input.bookKey,
        priority: input.priority ?? null,
        notes: input.notes ?? null,
      })
      .onConflictDoUpdate({
        target: [toReadEntries.userId, toReadEntries.bookKey],
        set: {
          priority: input.priority ?? null,
          notes: input.notes ?? null,
          addedAt: new Date(),
        },
      })
      .returning();
    if (!entry) {
      throw new Error("Failed to add to-read entry.");
    }

    return { id: entry.id };
  }),

  removeFromToRead: csrfProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(toReadEntries)
        .where(and(eq(toReadEntries.id, input.id), eq(toReadEntries.userId, ctx.user.id)));
      return { ok: true };
    }),

  updateProfile: csrfProtectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(users)
        .set({
          displayName: input.displayName ?? ctx.user.displayName,
          collectionVisibility: input.collectionVisibility ?? ctx.user.collectionVisibility,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      if (!updated) {
        throw new Error("Failed to update profile.");
      }

      return {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        collectionVisibility: updated.collectionVisibility,
        createdAt: updated.createdAt.toISOString(),
      };
    }),

  publicCollection: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [profile] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!profile || profile.collectionVisibility !== "public") {
        return null;
      }

      const [reading, queue] = await Promise.all([
        db
          .select()
          .from(readingEntries)
          .where(eq(readingEntries.userId, profile.id))
          .orderBy(desc(readingEntries.updatedAt)),
        db
          .select()
          .from(toReadEntries)
          .where(eq(toReadEntries.userId, profile.id))
          .orderBy(desc(toReadEntries.addedAt)),
      ]);

      return {
        profile: {
          id: profile.id,
          displayName: profile.displayName,
          createdAt: profile.createdAt.toISOString(),
        },
        reading: reading.map((entry) => ({
          id: entry.id,
          bookKey: entry.bookKey,
          startedAt: entry.startedAt.toISOString(),
          finishedAt: entry.finishedAt ? entry.finishedAt.toISOString() : null,
          progressPercent: entry.progressPercent,
          judgment: entry.judgment,
          notes: entry.notes,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
        toRead: queue.map((entry) => ({
          id: entry.id,
          bookKey: entry.bookKey,
          addedAt: entry.addedAt.toISOString(),
          priority: entry.priority,
          notes: entry.notes,
        })),
      };
    }),
});
