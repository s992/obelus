import { toDate, toDateInputValue, toIsoFromLocalDateInput, toPublishedLabel } from "@/lib/format";
import { describe, expect, it } from "vitest";

describe("format helpers", () => {
  it("converts date input to an ISO timestamp using local calendar date semantics", () => {
    const expected = new Date(2026, 1, 8).toISOString();
    expect(toIsoFromLocalDateInput("2026-02-08")).toBe(expected);
  });

  it("maps an ISO timestamp back to YYYY-MM-DD for date inputs", () => {
    const iso = new Date(2026, 1, 8).toISOString();
    expect(toDateInputValue(iso)).toBe("2026-02-08");
  });

  it("keeps legacy UTC-midnight date-only records on the intended calendar day", () => {
    const legacy = "2026-02-08T00:00:00.000Z";
    expect(toDateInputValue(legacy)).toBe("2026-02-08");
    expect(toDate(legacy)).toBe("2026-02-08");
  });

  it("formats publish dates as year-only labels", () => {
    expect(toPublishedLabel("2021-11-03")).toBe("Published 2021");
    expect(toPublishedLabel("November 1998")).toBe("Published 1998");
  });
});
