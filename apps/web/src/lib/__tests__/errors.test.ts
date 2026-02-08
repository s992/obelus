import { getErrorMessage } from "@/lib/errors";
import { describe, expect, it } from "vitest";

describe("getErrorMessage", () => {
  it("maps known transport codes to safe messages", () => {
    expect(getErrorMessage({ data: { code: "FORBIDDEN" } })).toContain("Security check failed");
    expect(getErrorMessage({ data: { code: "CONFLICT" } })).toContain("already in use");
  });

  it("returns fallback for unknown errors", () => {
    expect(getErrorMessage({ message: "raw backend error" })).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
