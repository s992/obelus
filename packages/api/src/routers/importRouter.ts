import { on } from 'node:events';
import { ImportFailureSchema } from '@obelus/shared/schema';
import z from 'zod';

import { db } from '../db/db';
import { worker } from '../queue/importWorker';
import { ProgressSchema } from '../queue/schema';
import { listGoodreadsImports } from '../sqlc/goodreads_import_sql';
import { privateProcedure, router } from '../trpc/trpc';

const outputSchema = z.array(
  z.object({
    createdAt: z.date(),
    completedAt: z.date().nullable().optional(),
    successCount: z.number(),
    failures: z.array(ImportFailureSchema),
  }),
);

export const importRouter = router({
  list: privateProcedure.query(async ({ ctx }) => {
    if (!ctx.currentUser.id) {
      return;
    }

    const imports = await listGoodreadsImports(db, { userid: ctx.currentUser.id });

    return outputSchema.safeParse(imports).data ?? [];
  }),
  status: privateProcedure.subscription(async function* ({ ctx, signal }) {
    for await (const [job, progress] of on(worker, 'progress', { signal })) {
      if (job.data.userId !== ctx.currentUser.id) {
        continue;
      }

      const parsed = ProgressSchema.safeParse(progress);

      if (!parsed.success) {
        continue;
      }

      yield parsed.data;
    }
  }),
});
