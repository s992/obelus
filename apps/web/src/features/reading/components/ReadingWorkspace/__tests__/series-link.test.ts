import { buildSeriesLinkData } from "@/features/reading/components/ReadingWorkspace/series-link";
import type { BookDetail } from "@obelus/shared";
import { describe, expect, it } from "vitest";

const baseDetail: BookDetail = {
  key: "hc:1",
  title: "Book",
  description: null,
  authors: ["Author"],
  publishDate: null,
  covers: [],
  coverUrl: null,
  seriesId: 101,
  seriesName: "The Weirkey Chronicles",
  seriesPosition: 4,
  seriesTotalBooks: 10,
  isbn_13: [],
  number_of_pages: null,
  seriesBooks: [],
};

describe("buildSeriesLinkData", () => {
  it("returns a formatted label when required series fields are present", () => {
    expect(buildSeriesLinkData(baseDetail)).toEqual({
      seriesId: 101,
      text: "4 of 10 in The Weirkey Chronicles",
    });
  });

  it("falls back to seriesBooks length when total count is unavailable", () => {
    expect(
      buildSeriesLinkData({
        ...baseDetail,
        seriesTotalBooks: null,
        seriesBooks: [
          { key: "hc:1", title: "One", position: 1 },
          { key: "hc:2", title: "Two", position: 2 },
          { key: "hc:3", title: "Three", position: 3 },
        ],
      }),
    ).toEqual({
      seriesId: 101,
      text: "4 of 3 in The Weirkey Chronicles",
    });
  });

  it("returns null when any required series field is missing", () => {
    expect(buildSeriesLinkData({ ...baseDetail, seriesId: null })).toBeNull();
    expect(buildSeriesLinkData({ ...baseDetail, seriesName: null })).toBeNull();
    expect(buildSeriesLinkData({ ...baseDetail, seriesPosition: null })).toBeNull();
    expect(
      buildSeriesLinkData({ ...baseDetail, seriesTotalBooks: null, seriesBooks: [] }),
    ).toBeNull();
  });
});
