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
