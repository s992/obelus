import { Queue } from "bullmq";
import { env } from "./env.js";

export const GOODREADS_IMPORT_QUEUE_NAME = "goodreads-imports";

export type GoodreadsImportJobPayload = {
  importId: string;
  userId: string;
};

const toBullConnection = () => {
  const parsed = new URL(env.REDIS_URL);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
};

export const bullConnection = toBullConnection();

export const goodreadsImportQueue = new Queue<GoodreadsImportJobPayload>(
  GOODREADS_IMPORT_QUEUE_NAME,
  {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 200,
      removeOnFail: 200,
    },
  },
);
