import { normalizeBookKeys } from "@/features/books/hooks/useBookDetailsByKeys";
import { describe, expect, it } from "vitest";

describe("normalizeBookKeys", () => {
  it("deduplicates and sorts keys", () => {
    expect(normalizeBookKeys(["/works/OL2W", "/works/OL1W", "/works/OL2W"])).toEqual([
      "/works/OL1W",
      "/works/OL2W",
    ]);
  });
});
