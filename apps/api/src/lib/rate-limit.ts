import { TRPCError } from "@trpc/server";

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

const nowMs = () => Date.now();

const sweepExpired = () => {
  const now = nowMs();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const enforceLimit = (key: string, maxAttempts: number, windowMs: number) => {
  sweepExpired();

  const now = nowMs();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again shortly.",
    });
  }
};

export const enforceAuthRateLimit = (identifier: string) => {
  enforceLimit(`auth:${identifier}`, 10, 60_000);
};

export const enforceCsrfRateLimit = (identifier: string) => {
  enforceLimit(`csrf:${identifier}`, 60, 60_000);
};

export const __resetRateLimitStateForTests = () => {
  buckets.clear();
};
