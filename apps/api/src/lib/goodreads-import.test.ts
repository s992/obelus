import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { GoodreadsImportOptions } from "@obelus/shared";
import { pool, redis } from "../db/client.js";
import { __testables } from "./goodreads-import.js";

const defaultOptions: GoodreadsImportOptions = {
  mapRatings: true,
  ratings: {
    star1: "Rejected",
    star2: "Rejected",
    star3: "Unjudged",
    star4: "Accepted",
    star5: "Accepted",
  },
};

after(async () => {
  await Promise.allSettled([redis.quit(), pool.end()]);
});

test("normalizeIsbn removes excel quoting artifacts", () => {
  assert.equal(__testables.normalizeIsbn('=""""'), null);
  assert.equal(__testables.normalizeIsbn('="9780316489768"'), "9780316489768");
  assert.equal(__testables.normalizeIsbn("978-0-316-48976-8"), "9780316489768");
});

test("parseGoodreadsDate parses slash-separated dates", () => {
  const parsed = __testables.parseGoodreadsDate("2026/02/07");
  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.getFullYear(), 2026);
  assert.equal(parsed?.getMonth(), 1);
  assert.equal(parsed?.getDate(), 7);
});

test("buildRowPlan infers start date from finish date when read row lacks Date Added", () => {
  const plan = __testables.buildRowPlan(
    {
      "Exclusive Shelf": "read",
      "Date Added": "",
      "Date Read": "2026/02/07",
      "My Rating": "4",
    },
    defaultOptions,
  );

  assert.equal(plan.target, "reading");
  assert.ok(plan.startedAt);
  assert.ok(plan.finishedAt);
  assert.equal(plan.judgment, "Accepted");
  assert.equal(
    plan.warnings.some((warning) => warning.code === "INFERRED_START_DATE"),
    true,
  );
});

test("buildRowPlan maps each star independently", () => {
  const plan = __testables.buildRowPlan(
    {
      "Exclusive Shelf": "currently-reading",
      "Date Added": "2026/02/07",
      "Date Read": "",
      "My Rating": "2",
    },
    {
      mapRatings: true,
      ratings: {
        star1: "Accepted",
        star2: "Unjudged",
        star3: "Rejected",
        star4: "Rejected",
        star5: "Accepted",
      },
    },
  );

  assert.equal(plan.judgment, null);
});

test("resolveBookKeyWithFallback stops after first matched lookup", async () => {
  const calls: string[] = [];
  const result = await __testables.resolveBookKeyWithFallback([
    async () => {
      calls.push("isbn13");
      return { bookKey: null, reason: "not_found" as const };
    },
    async () => {
      calls.push("isbn10");
      return { bookKey: "hc:123", reason: "matched" as const };
    },
    async () => {
      calls.push("title_author");
      return { bookKey: "hc:999", reason: "matched" as const };
    },
  ]);

  assert.equal(result.resolvedBookKey, "hc:123");
  assert.deepEqual(calls, ["isbn13", "isbn10"]);
  assert.deepEqual(result.lookupOutcomes, [
    { bookKey: null, reason: "not_found" },
    { bookKey: "hc:123", reason: "matched" },
  ]);
});

test("resolveBookKeyWithFallback runs all attempts when no lookup matches", async () => {
  const result = await __testables.resolveBookKeyWithFallback([
    async () => ({ bookKey: null, reason: "not_found" as const }),
    async () => ({ bookKey: null, reason: "upstream_error" as const }),
    async () => ({ bookKey: null, reason: "rate_limited" as const }),
  ]);

  assert.equal(result.resolvedBookKey, null);
  assert.deepEqual(result.lookupOutcomes, [
    { bookKey: null, reason: "not_found" },
    { bookKey: null, reason: "upstream_error" },
    { bookKey: null, reason: "rate_limited" },
  ]);
});

test("hydrateMatchedBookMetadata fetches fresh detail when available", async () => {
  const fetchFreshDetailCalls: Array<{
    bookKey: string;
    options?: { forceRemoteFetch?: boolean };
  }> = [];
  const seedFallbackMetadataCalls: unknown[] = [];

  const result = await __testables.hydrateMatchedBookMetadata(
    {
      bookKey: "hc:123",
      title: "The Book",
      author: "The Author",
    },
    {
      fetchFreshDetail: async (bookKey, options) => {
        fetchFreshDetailCalls.push({ bookKey, options });
        return {
          key: bookKey,
          title: "The Book",
          description: null,
          authors: ["The Author"],
          publishDate: null,
          covers: ["https://example.com/cover.jpg"],
          coverUrl: "https://example.com/cover.jpg",
          seriesName: null,
          seriesPosition: null,
          seriesBooks: [],
          isbn_13: [],
          number_of_pages: null,
        };
      },
      seedFallbackMetadata: async (entries) => {
        seedFallbackMetadataCalls.push(entries);
      },
    },
  );

  assert.equal(result, "hydrated");
  assert.deepEqual(fetchFreshDetailCalls, [
    { bookKey: "hc:123", options: { forceRemoteFetch: true } },
  ]);
  assert.equal(seedFallbackMetadataCalls.length, 0);
});

test("hydrateMatchedBookMetadata seeds fallback metadata if fresh fetch fails", async () => {
  const seedFallbackMetadataCalls: Array<
    Array<{
      key: string;
      title: string;
      authors?: string[];
      coverUrls?: string[];
      publishDate?: string | null;
      isbn13?: string[];
      pages?: number | null;
    }>
  > = [];

  const result = await __testables.hydrateMatchedBookMetadata(
    {
      bookKey: "hc:456",
      title: "Fallback Book",
      author: "Fallback Author",
    },
    {
      fetchFreshDetail: async () => {
        throw new Error("Hardcover unavailable");
      },
      seedFallbackMetadata: async (entries) => {
        seedFallbackMetadataCalls.push(entries);
      },
    },
  );

  assert.equal(result, "fallback_seeded");
  assert.deepEqual(seedFallbackMetadataCalls, [
    [
      {
        key: "hc:456",
        title: "Fallback Book",
        authors: ["Fallback Author"],
        publishDate: null,
        coverUrls: [],
      },
    ],
  ]);
});
