import assert from "node:assert/strict";
import { after, test } from "node:test";
import { pool, redis } from "../db/client.js";
import { __testables } from "./books.js";

after(async () => {
  await Promise.allSettled([redis.quit(), pool.end()]);
});

test("resolveDetailsByKeysInBatches deduplicates keys, batches lookups, and skips failures", async () => {
  const keys = [
    ...Array.from({ length: 50 }, (_, index) => `hc:${index + 1}`),
    ...Array.from({ length: 50 }, (_, index) => `hc:${index + 51}`),
    "hc:10",
  ];

  const calls: string[] = [];
  const details = await __testables.resolveDetailsByKeysInBatches(keys, async (key) => {
    calls.push(key);
    if (key === "hc:60") {
      throw new Error("simulated lookup failure");
    }
    return { key };
  });

  assert.equal(calls.length, 100);
  assert.equal("hc:10" in details, true);
  assert.equal("hc:60" in details, false);
  assert.equal(details["hc:1"]?.key, "hc:1");
  assert.equal(details["hc:100"]?.key, "hc:100");
});

test("chunkKeys splits arrays according to the configured API batch size", () => {
  const keys = Array.from({ length: 120 }, (_, index) => `hc:${index + 1}`);
  const chunks = __testables.chunkKeys(keys, __testables.DETAILS_BY_KEYS_BATCH_SIZE);

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0]?.length, 50);
  assert.equal(chunks[1]?.length, 50);
  assert.equal(chunks[2]?.length, 20);
});
