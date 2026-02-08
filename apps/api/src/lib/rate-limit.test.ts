import assert from "node:assert/strict";
import test from "node:test";
import { TRPCError } from "@trpc/server";
import { __resetRateLimitStateForTests, enforceAuthRateLimit } from "./rate-limit.js";

test("enforceAuthRateLimit rejects after threshold", () => {
  __resetRateLimitStateForTests();
  const key = "127.0.0.1:login:test@example.com";
  for (let i = 0; i < 10; i += 1) {
    enforceAuthRateLimit(key);
  }

  assert.throws(
    () => enforceAuthRateLimit(key),
    (error: unknown) => {
      return error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS";
    },
  );
});
