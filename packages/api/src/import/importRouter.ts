import { ImportFailureSchema } from '@obelus/shared/schema';
import type { Job, JobProgress } from 'bullmq';
import z from 'zod';

import { db } from '../db/db';
import { worker } from '../queue/importWorker';
import { ProgressSchema } from '../queue/schema';
import { listGoodreadsImports } from '../sqlc/goodreads_import_sql';
import { privateProcedure, router } from '../trpc/trpc';

const outputSchema = z.array(
  z.object({
    createdAt: z.date(),
    completedAt: z.date().nullable(),
    successCount: z.number(),
    failures: z.array(ImportFailureSchema),
  }),
);

type Progress = z.infer<typeof ProgressSchema>;

export const importRouter = router({
  list: privateProcedure.query(async ({ ctx }) => {
    if (!ctx.currentUser.id) {
      return;
    }

    const imports = await listGoodreadsImports(db, { userid: ctx.currentUser.id });

    return outputSchema.safeParse(imports).data ?? [];
  }),
  status: privateProcedure.subscription(async function* ({ ctx }) {
    const channel = createChannel<Progress>();

    const onProgress = (job: Job, progress: JobProgress) => {
      if (job.data.userId === ctx.currentUser.id) {
        const parsed = ProgressSchema.safeParse(progress);

        if (parsed.success) {
          channel.push(parsed.data);
        }
      }
    };

    worker.on('progress', onProgress);

    for await (const event of channel) {
      yield event;
    }
  }),
});

function createChannel<T>() {
  const queue: T[] = [];
  let resolve: (() => void) | null = null;
  let done = false;

  return {
    push(value: T) {
      queue.push(value);
      resolve?.();
    },
    end() {
      done = true;
      resolve?.();
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else if (done) {
          return;
        } else {
          await new Promise<void>((r) => (resolve = r));
        }
      }
    },
  };
}
