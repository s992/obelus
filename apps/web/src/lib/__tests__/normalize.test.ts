import {
  normalizeBookKeyFromParam,
  normalizeInputValue,
  normalizeOptionalIsbn13,
  normalizeOptionalNumber,
  normalizeOptionalString,
} from "@/lib/normalize";
import { describe, expect, it } from "vitest";

describe("normalize utilities", () => {
  it("normalizes input values from event-like objects", () => {
    expect(normalizeInputValue("abc")).toBe("abc");
    expect(normalizeInputValue({ target: { value: "xyz" } })).toBe("xyz");
    expect(normalizeInputValue({ currentTarget: { value: "123" } })).toBe("123");
    expect(normalizeInputValue(null)).toBe("");
  });

  it("normalizes optional string and number values", () => {
    expect(normalizeOptionalString("  hello  ")).toBe("hello");
    expect(normalizeOptionalString("   ")).toBeNull();
    expect(normalizeOptionalNumber("42")).toBe(42);
    expect(normalizeOptionalNumber("abc")).toBeNull();
  });

  it("normalizes isbn and route params", () => {
    expect(normalizeOptionalIsbn13(["", "9781234567890"])).toBe("9781234567890");
    expect(normalizeBookKeyFromParam("%2Fworks%2FOL1W")).toBe("/works/OL1W");
    expect(normalizeBookKeyFromParam("works/OL1W")).toBe("/works/OL1W");
    expect(normalizeBookKeyFromParam("")).toBeNull();
  });
});
