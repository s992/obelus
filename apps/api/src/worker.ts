import { Worker } from "bullmq";
import { checkDatabaseReadiness, checkRedisReadiness } from "./db/client.js";
import {
  GOODREADS_IMPORT_QUEUE_NAME,
  type GoodreadsImportJobPayload,
  bullConnection,
} from "./lib/goodreads-import-queue.js";
import { processGoodreadsImport } from "./lib/goodreads-import.js";

const boot = async () => {
  const [dbReady, redisReady] = await Promise.all([
    checkDatabaseReadiness(),
    checkRedisReadiness(),
  ]);

  if (!dbReady || !redisReady) {
    throw new Error("Cannot start import worker: database or Redis is unavailable.");
  }

  const worker = new Worker<GoodreadsImportJobPayload>(
    GOODREADS_IMPORT_QUEUE_NAME,
    async (job) => {
      await processGoodreadsImport(job.data.importId, job.data.userId);
    },
    {
      connection: bullConnection,
      concurrency: 1,
    },
  );

  worker.on("failed", (job, error) => {
    console.error("Goodreads import job failed", {
      jobId: job?.id,
      importId: job?.data.importId,
      error: error.message,
    });
  });

  worker.on("completed", (job) => {
    console.info("Goodreads import job completed", {
      jobId: job.id,
      importId: job.data.importId,
    });
  });

  const shutdown = async () => {
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
};

boot().catch((error) => {
  console.error(error);
  process.exit(1);
});
