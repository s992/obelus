import { and, count, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { readingEntries, toReadEntries } from "../db/schema.js";
import { protectedProcedure, router } from "../lib/trpc.js";

const monthRange = () => {
  const now = new Date();
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59));
    months.push({
      start,
      end,
      label: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
};

export const reportsRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [totalReadResult, inProgressResult, toReadResult, acceptedResult, rejectedResult] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(readingEntries)
          .where(and(eq(readingEntries.userId, ctx.user.id), isNotNull(readingEntries.finishedAt))),
        db
          .select({ value: count() })
          .from(readingEntries)
          .where(
            and(eq(readingEntries.userId, ctx.user.id), sql`${readingEntries.finishedAt} is null`),
          ),
        db
          .select({ value: count() })
          .from(toReadEntries)
          .where(eq(toReadEntries.userId, ctx.user.id)),
        db
          .select({ value: count() })
          .from(readingEntries)
          .where(
            and(eq(readingEntries.userId, ctx.user.id), eq(readingEntries.judgment, "Accepted")),
          ),
        db
          .select({ value: count() })
          .from(readingEntries)
          .where(
            and(eq(readingEntries.userId, ctx.user.id), eq(readingEntries.judgment, "Rejected")),
          ),
      ]);

    const monthly = await Promise.all(
      monthRange().map(async (month) => {
        const [started, finished] = await Promise.all([
          db
            .select({ value: count() })
            .from(readingEntries)
            .where(
              and(
                eq(readingEntries.userId, ctx.user.id),
                gte(readingEntries.startedAt, month.start),
                lte(readingEntries.startedAt, month.end),
              ),
            ),
          db
            .select({ value: count() })
            .from(readingEntries)
            .where(
              and(
                eq(readingEntries.userId, ctx.user.id),
                isNotNull(readingEntries.finishedAt),
                gte(readingEntries.finishedAt, month.start),
                lte(readingEntries.finishedAt, month.end),
              ),
            ),
        ]);

        return {
          month: month.label,
          startedBooks: started[0]?.value ?? 0,
          finishedBooks: finished[0]?.value ?? 0,
          pagesEstimate: (finished[0]?.value ?? 0) * 320,
        };
      }),
    );

    return {
      totalRead: totalReadResult[0]?.value ?? 0,
      inProgress: inProgressResult[0]?.value ?? 0,
      toRead: toReadResult[0]?.value ?? 0,
      accepted: acceptedResult[0]?.value ?? 0,
      rejected: rejectedResult[0]?.value ?? 0,
      monthly,
    };
  }),
});
