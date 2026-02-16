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

test("enrichSeriesBooksForUser maps reading, finished, planned, and unknown states", () => {
  const books = [
    {
      key: "hc:1",
      title: "Book 1",
      position: 1,
      publishDate: "2020-01-01",
      coverUrl: null,
      description: null,
      authors: ["Author 1"],
    },
    {
      key: "hc:2",
      title: "Book 2",
      position: 2,
      publishDate: "2020-01-02",
      coverUrl: null,
      description: null,
      authors: ["Author 2"],
    },
    {
      key: "hc:3",
      title: "Book 3",
      position: 3,
      publishDate: "2020-01-03",
      coverUrl: null,
      description: null,
      authors: ["Author 3"],
    },
    {
      key: "hc:4",
      title: "Book 4",
      position: 4,
      publishDate: "2020-01-04",
      coverUrl: null,
      description: null,
      authors: ["Author 4"],
    },
  ];

  const enriched = __testables.enrichSeriesBooksForUser(
    books,
    [
      {
        bookKey: "hc:1",
        startedAt: new Date("2025-01-10T00:00:00.000Z"),
        finishedAt: null,
        judgment: null,
      },
      {
        bookKey: "hc:2",
        startedAt: new Date("2025-01-01T00:00:00.000Z"),
        finishedAt: new Date("2025-01-20T00:00:00.000Z"),
        judgment: "Accepted",
      },
    ],
    [{ bookKey: "hc:3", priority: 2 }],
  );

  assert.equal(enriched[0]?.userState.status, "reading");
  assert.equal(enriched[0]?.userState.supportingText, "Started 2025-01-10");
  assert.equal(enriched[1]?.userState.status, "finished");
  assert.equal(enriched[1]?.userState.judgment, "Accepted");
  assert.equal(enriched[1]?.userState.supportingText, "Finished 2025-01-20");
  assert.equal(enriched[2]?.userState.status, "planned");
  assert.equal(enriched[2]?.userState.supportingText, "Priority 2");
  assert.equal(enriched[3]?.userState.status, "not-in-library");
  assert.equal(enriched[3]?.userState.supportingText, null);
});
