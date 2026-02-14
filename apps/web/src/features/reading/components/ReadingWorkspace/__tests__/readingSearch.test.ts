import type { ReadingEntry, ToReadEntry } from "@obelus/shared";
import { describe, expect, it } from "vitest";
import {
  buildMyBookSearchItems,
  createAbortableCachedSearch,
  filterMyBookSearchItems,
  toFocusableItems,
} from "../readingSearch";

const readingEntry = (overrides: Partial<ReadingEntry>): ReadingEntry => ({
  id: "11111111-1111-4111-8111-111111111111",
  bookKey: "/works/OL1W",
  startedAt: "2025-01-01T00:00:00.000Z",
  finishedAt: null,
  progressPercent: null,
  judgment: null,
  notes: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  ...overrides,
});

const queueEntry = (overrides: Partial<ToReadEntry>): ToReadEntry => ({
  id: "22222222-2222-4222-8222-222222222222",
  bookKey: "/works/OL2W",
  addedAt: "2025-01-01T00:00:00.000Z",
  priority: null,
  notes: null,
  ...overrides,
});

describe("readingSearch", () => {
  it("builds and filters my-book matches across statuses", () => {
    const items = buildMyBookSearchItems(
      [
        readingEntry({ bookKey: "/works/OL1W", finishedAt: null }),
        readingEntry({
          id: "33333333-3333-4333-8333-333333333333",
          bookKey: "/works/OL3W",
          finishedAt: "2025-02-01T00:00:00.000Z",
        }),
      ],
      [queueEntry({ bookKey: "/works/OL2W" })],
      {
        "/works/OL1W": {
          title: "Dune",
          authors: ["Frank Herbert"],
          covers: ["https://example.com/1.jpg"],
        },
        "/works/OL2W": {
          title: "Hyperion",
          authors: ["Dan Simmons"],
          covers: ["https://example.com/2.jpg"],
        },
        "/works/OL3W": {
          title: "Foundation",
          authors: ["Isaac Asimov"],
          covers: ["https://example.com/3.jpg"],
        },
      },
    );

    const matches = filterMyBookSearchItems(items, "simmons");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      bookKey: "/works/OL2W",
      status: "planned",
      title: "Hyperion",
    });
  });

  it("returns combined focus order with My books before Add new books", () => {
    const ordered = toFocusableItems(
      [
        {
          bookKey: "/works/OL1W",
          title: "Dune",
          authors: ["Frank Herbert"],
          coverUrl: "https://example.com/1.jpg",
          status: "currently-reading",
        },
      ],
      [
        {
          key: "/works/OL9W",
          title: "Book from Hardcover",
          authorName: ["Author"],
          firstPublishYear: 2001,
          coverUrl: null,
        },
      ],
    );

    expect(ordered.map((item) => item.type)).toEqual(["my-book", "add-book"]);
  });

  it("aborts previous in-flight remote request and caches successful responses", async () => {
    const signals: AbortSignal[] = [];
    const resolverMap = new Map<string, (value: string[]) => void>();

    const search = createAbortableCachedSearch<string>((query, signal) => {
      signals.push(signal);
      return new Promise<string[]>((resolve) => {
        resolverMap.set(query, resolve);
      });
    });

    const firstPromise = search.search("du");
    const secondPromise = search.search("dun");

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    resolverMap.get("du")?.(["old"]);
    resolverMap.get("dun")?.(["new"]);

    await expect(firstPromise).resolves.toEqual([]);
    await expect(secondPromise).resolves.toEqual(["new"]);

    const cached = search.getCached("dun");
    expect(cached).toEqual(["new"]);
  });
});
